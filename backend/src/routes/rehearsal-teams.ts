import { Router } from 'express'
import mongoose from 'mongoose'
import { RehearsalLog, RehearsalTeam, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireRehearsalAccess } from '../middleware/require-rehearsal.js'
import { canSeeKind, findVisibleTeam, teamKind, type RehearsalAccess } from '../lib/rehearsal-access.js'
import { cleanNames, cleanText } from '../lib/rehearsal-input.js'
import type { RehearsalKind } from '../types/index.js'

// 연습일지(열린 단막극·열린 낭독극) - 팀 구성 (관리 화면 '연습일지 설정')
export const rehearsalTeamsRouter = Router()

rehearsalTeamsRouter.use(requireRehearsalAccess)

// 낭독극은 작품명·팀명이 따로 없다(사용자 결정). 두 칸 모두 이 이름으로 고정해 저장한다
const READING_TEAM_NAME = '열린 낭독극'

function readTeamBody(body: Record<string, unknown>, kind: RehearsalKind) {
  const isReading = kind === 'reading'
  return {
    title: isReading ? READING_TEAM_NAME : cleanText(body.title, 100),
    name: isReading ? READING_TEAM_NAME : cleanText(body.name, 60),
    director: cleanText(body.director, 40),
    // 낭독극에는 조연출이 없고, 단막극에는 함께하는 강사가 없다. 종류에 맞지 않는 칸은 비운다
    assistantDirector: isReading ? '' : cleanText(body.assistantDirector, 40),
    instructors: isReading ? cleanNames(body.instructors, 5) : [],
    members: cleanNames(body.members),
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
  }
}

/** 빠진 필수 칸이 있으면 안내 문구를, 없으면 null을 돌려준다 */
function missingFieldMessage(fields: { title: string; name: string; director: string }, kind: RehearsalKind) {
  if (fields.title && fields.name && fields.director) return null
  return kind === 'reading' ? '메인강사를 입력해주세요.' : '작품명, 팀명, 연출을 입력해주세요.'
}

rehearsalTeamsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    const teams = await RehearsalTeam.find().sort({ order: 1, createdAt: 1 }).lean<{ kind?: string }[]>()
    // 자기 종류의 팀만 돌려준다. kind가 없는 예전 팀도 화면이 헷갈리지 않게 값을 채워 보낸다
    ok(
      res,
      teams
        .map((team) => ({ ...team, kind: teamKind(team) }))
        .filter((team) => canSeeKind(access, team.kind))
    )
  })
)

rehearsalTeamsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    if (!access.canManageTeams) {
      fail(res, '팀 구성은 관리자와 담당 계정만 만들 수 있습니다.', 403)
      return
    }

    // 담당 계정은 자기 종류의 팀만 만든다. 관리자는 요청 값으로 고르고, 없으면 단막극이다
    const kind: RehearsalKind = access.kind ?? (req.body?.kind === 'reading' ? 'reading' : 'short_play')
    const fields = readTeamBody(req.body ?? {}, kind)
    const missing = missingFieldMessage(fields, kind)
    if (missing) {
      fail(res, missing, 400)
      return
    }

    const team = await RehearsalTeam.create({ ...fields, kind })
    ok(res, team.toObject(), '팀을 만들었습니다.', 201)
  })
)

rehearsalTeamsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    if (!access.canManageTeams) {
      fail(res, '팀 구성은 관리자와 담당 계정만 고칠 수 있습니다.', 403)
      return
    }
    // 다른 종류의 팀은 없는 팀처럼 다룬다 (단막극 담당이 낭독극 팀을 고치지 못하게)
    const existing = await findVisibleTeam(access, req.params.id)
    if (!existing) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }

    // 종류는 바꾸지 않는다. 계정 아이디 규칙과 이미 쓴 일지의 모양이 종류에 묶여 있다
    const kind = teamKind(existing)
    const fields = readTeamBody(req.body ?? {}, kind)
    const missing = missingFieldMessage(fields, kind)
    if (missing) {
      fail(res, missing, 400)
      return
    }

    // 팀원 명단을 바꿔도 이미 쓴 일지의 출석부(roster)는 그대로 남는다
    const team = await RehearsalTeam.findByIdAndUpdate(req.params.id, fields, { new: true }).lean<{ kind?: string } | null>()
    if (!team) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }
    ok(res, { ...team, kind }, '팀 정보를 고쳤습니다.')
  })
)

rehearsalTeamsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!res.locals.rehearsal.canDelete) {
      fail(res, '삭제는 총괄 관리자와 관리자만 할 수 있습니다.', 403)
      return
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }

    // 일지가 딸린 팀을 지우면 일지가 어느 팀 것인지 알 수 없게 되므로 막는다
    const logCount = await RehearsalLog.countDocuments({ team: req.params.id })
    if (logCount > 0) {
      fail(res, `이 팀에 연습일지가 ${logCount}건 있어 지울 수 없습니다. 일지를 먼저 지워주세요.`, 409)
      return
    }

    const team = await RehearsalTeam.findByIdAndDelete(req.params.id)
    if (!team) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }
    // 이 팀에 묶여 있던 작성 계정은 팀 연결만 끊는다 (계정은 사용자 관리에서 정리)
    await User.updateMany({ rehearsalTeam: req.params.id }, { $unset: { rehearsalTeam: 1 } })
    ok(res, null, '팀을 지웠습니다.')
  })
)
