import { Router } from 'express'
import mongoose from 'mongoose'
import { RehearsalComment, RehearsalLog, RehearsalTeam } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireRehearsalAccess } from '../middleware/require-rehearsal.js'
import { canWriteTeam, findVisibleTeam, teamKind, visibleTeamIds, type RehearsalAccess } from '../lib/rehearsal-access.js'
import { cleanDate, cleanNames, cleanPhotoUrls, cleanText, cleanTime } from '../lib/rehearsal-input.js'

// 연습일지 (열린 단막극·열린 낭독극). 계정은 자기 종류의 일지만 본다
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

/**
 * 일지를 고칠 때 쓰는 출석부: 그 일지의 출석부에, 지금 팀원 중 빠져 있는 사람을 뒤에 붙인다.
 * 일지를 먼저 쓰고 팀원을 나중에 등록하면 그 사람이 출석부에 없어 출석 체크를 할 수 없었다.
 * 팀에서 빠진 사람은 지우지 않는다 (그날 기록은 그대로 남긴다)
 */
function mergeRoster(roster: string[], members: string[]) {
  return [...roster, ...members.filter((name) => !roster.includes(name))]
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
    const access: RehearsalAccess = res.locals.rehearsal
    const filter: Record<string, unknown> = {}
    // 볼 수 있는 팀으로 범위를 좁힌다 (단막극 계정에 낭독극 일지가 섞이지 않게). null이면 전부 볼 수 있다
    const allowedIds = await visibleTeamIds(access)
    if (typeof req.query.team === 'string' && mongoose.isValidObjectId(req.query.team)) {
      if (allowedIds && !allowedIds.includes(req.query.team)) {
        ok(res, [])
        return
      }
      filter.team = req.query.team
    } else if (allowedIds) {
      // 연산자 조건은 trusted로 감싸야 sanitizeFilter에 막히지 않는다 (값은 DB에서 읽은 id라 안전)
      filter.team = mongoose.trusted({ $in: allowedIds })
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
    // 다른 종류(단막극↔낭독극)의 일지는 없는 일지처럼 다룬다
    if (!log || !(await findVisibleTeam(res.locals.rehearsal, String(log.team)))) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }

    const teamLogs = await RehearsalLog.find({ team: log.team }).select('_id').sort(SESSION_ORDER).lean<LeanLog[]>()
    const sessionNo = teamLogs.findIndex((item) => String(item._id) === String(log._id)) + 1
    const team = await RehearsalTeam.findById(log.team).lean<{ kind?: string } | null>()
    // kind가 없는 예전 팀도 화면이 단막극으로 알아보게 값을 채워 보낸다
    ok(res, { ...log, sessionNo, teamInfo: team ? { ...team, kind: teamKind(team) } : null })
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
    // 볼 수 없는 종류의 팀은 없는 팀처럼 다룬다 (모든 팀에 쓸 수 있는 담당 계정도 자기 종류 안에서만)
    const team = await findVisibleTeam(access, teamId)
    if (!team) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }
    if (!canWriteTeam(access, teamId)) {
      fail(res, '이 팀의 연습일지를 쓸 권한이 없습니다.', 403)
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
    const team = existing ? await findVisibleTeam(access, String(existing.team)) : null
    if (!existing || !team) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    if (!canWriteTeam(access, String(existing.team))) {
      fail(res, '이 팀의 연습일지를 고칠 권한이 없습니다.', 403)
      return
    }

    const fields = readLogBody(req.body ?? {}, access)
    if (!fields.date) {
      fail(res, '연습 날짜를 선택해주세요.', 400)
      return
    }
    // 팀은 바꾸지 않는다. 출석부는 그 일지의 명단에 지금 팀원 중 빠진 사람을 더한 것이다.
    // 일지를 쓴 뒤에 등록한 팀원도 고치기 화면에서 출석 체크를 할 수 있어야 하기 때문이다
    const roster = mergeRoster(existing.roster ?? [], team.members ?? [])
    fields.roster = roster
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
    // 일지가 없어지면 달린 댓글도 볼 곳이 없으므로 함께 지운다
    await RehearsalComment.deleteMany({ log: log._id })
    ok(res, null, '연습일지를 지웠습니다.')
  })
)
