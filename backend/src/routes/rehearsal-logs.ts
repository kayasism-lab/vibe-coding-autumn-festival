import { Router } from 'express'
import mongoose from 'mongoose'
import { RehearsalLog, RehearsalTeam } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireRehearsalAccess } from '../middleware/require-rehearsal.js'
import { canWriteTeam, type RehearsalAccess } from '../lib/rehearsal-access.js'
import { cleanDate, cleanNames, cleanPhotoUrls, cleanText, cleanTime } from '../lib/rehearsal-input.js'

// 열린 단막극 연습일지
export const rehearsalLogsRouter = Router()

rehearsalLogsRouter.use(requireRehearsalAccess)

// 번호를 매기는 순서: 날짜 → 시작 시간 → 먼저 쓴 순
const SESSION_ORDER = { date: 1, startTime: 1, createdAt: 1 } as const

type LeanLog = { _id: mongoose.Types.ObjectId; team: mongoose.Types.ObjectId } & Record<string, unknown>

/** 팀마다 날짜순으로 1부터 번호를 붙인다. '#N번째 연습'의 N */
function withSessionNumbers<T extends LeanLog>(logs: T[]) {
  const countByTeam = new Map<string, number>()
  return logs.map((log) => {
    const key = String(log.team)
    const sessionNo = (countByTeam.get(key) ?? 0) + 1
    countByTeam.set(key, sessionNo)
    return { ...log, sessionNo }
  })
}

/** 출석부에 있는 이름만 남기고, 순서는 출석부 순서로 맞춘다 (일지·PDF에서 이름 순서가 흔들리지 않게) */
function pickAttendees(roster: string[], attendees: string[]) {
  const checked = new Set(attendees)
  return roster.filter((name) => checked.has(name))
}

/** 본문에서 일지 내용 칸을 읽는다. 연출 코멘트는 쓸 권한이 있을 때만 넣는다 */
function readLogBody(body: Record<string, unknown>, access: RehearsalAccess) {
  const fields: Record<string, unknown> = {
    date: cleanDate(body.date),
    startTime: cleanTime(body.startTime),
    endTime: cleanTime(body.endTime),
    attendees: cleanNames(body.attendees),
    topic: cleanText(body.topic, 200),
    content: cleanText(body.content, 10000),
    photos: cleanPhotoUrls(body.photos),
    updatedByName: access.displayName,
  }
  if (access.canComment) fields.directorComment = cleanText(body.directorComment, 5000)
  return fields
}

rehearsalLogsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {}
    if (typeof req.query.team === 'string' && mongoose.isValidObjectId(req.query.team)) {
      filter.team = req.query.team
    }

    // 번호를 매기려면 팀의 일지 전체가 필요하다. 한 팀이 수십 건 수준이라 전부 읽어도 가볍다
    const logs = await RehearsalLog.find(filter).sort(SESSION_ORDER).lean<LeanLog[]>()
    ok(res, withSessionNumbers(logs))
  })
)

rehearsalLogsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    const log = await RehearsalLog.findById(req.params.id).lean<LeanLog | null>()
    if (!log) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }

    const teamLogs = await RehearsalLog.find({ team: log.team }).select('_id').sort(SESSION_ORDER).lean<LeanLog[]>()
    const sessionNo = teamLogs.findIndex((item) => String(item._id) === String(log._id)) + 1
    const team = await RehearsalTeam.findById(log.team).lean()
    ok(res, { ...log, sessionNo, teamInfo: team })
  })
)

rehearsalLogsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    const teamId = typeof req.body?.team === 'string' ? req.body.team : ''
    if (!mongoose.isValidObjectId(teamId)) {
      fail(res, '팀을 선택해주세요.', 400)
      return
    }
    if (!canWriteTeam(access, teamId)) {
      fail(res, '자기 팀의 연습일지만 쓸 수 있습니다.', 403)
      return
    }

    const team = await RehearsalTeam.findById(teamId).select('members').lean<{ members: string[] } | null>()
    if (!team) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }

    const fields = readLogBody(req.body, access)
    if (!fields.date) {
      fail(res, '연습 날짜를 선택해주세요.', 400)
      return
    }

    // 출석부는 쓰는 시점의 팀원 명단으로 고정한다. 나중에 팀원이 바뀌어도 그날 기록은 그대로다
    const roster = team.members ?? []
    const log = await RehearsalLog.create({
      ...fields,
      team: teamId,
      roster,
      attendees: pickAttendees(roster, fields.attendees as string[]),
      createdByName: access.displayName,
    })
    ok(res, log.toObject(), '연습일지를 저장했습니다.', 201)
  })
)

rehearsalLogsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    if (!mongoose.isValidObjectId(req.params.id)) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    const existing = await RehearsalLog.findById(req.params.id)
      .select('team roster')
      .lean<{ team: mongoose.Types.ObjectId; roster: string[] } | null>()
    if (!existing) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    if (!canWriteTeam(access, String(existing.team))) {
      fail(res, '자기 팀의 연습일지만 고칠 수 있습니다.', 403)
      return
    }

    const fields = readLogBody(req.body ?? {}, access)
    if (!fields.date) {
      fail(res, '연습 날짜를 선택해주세요.', 400)
      return
    }
    // 팀은 바꾸지 않는다. 출석은 그 일지의 출석부 안에서만 고른다.
    // 팀원을 등록하기 전에 쓴 일지는 출석부가 비어 있으므로, 이때만 지금 팀원 명단으로 채운다
    let roster = existing.roster ?? []
    if (roster.length === 0) {
      const team = await RehearsalTeam.findById(existing.team).select('members').lean<{ members: string[] } | null>()
      roster = team?.members ?? []
      fields.roster = roster
    }
    fields.attendees = pickAttendees(roster, fields.attendees as string[])

    const log = await RehearsalLog.findByIdAndUpdate(req.params.id, fields, { new: true }).lean()
    ok(res, log, '연습일지를 고쳤습니다.')
  })
)

rehearsalLogsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    if (!access.canDelete) {
      fail(res, '연습일지 삭제는 총괄 관리자와 관리자만 할 수 있습니다.', 403)
      return
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }

    const log = await RehearsalLog.findByIdAndDelete(req.params.id)
    if (!log) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    ok(res, null, '연습일지를 지웠습니다.')
  })
)
