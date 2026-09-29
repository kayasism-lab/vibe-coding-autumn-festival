import { Router } from 'express'
import mongoose from 'mongoose'
import { RehearsalLog, RehearsalTeam, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireRehearsalAccess } from '../middleware/require-rehearsal.js'
import { cleanNames, cleanText } from '../lib/rehearsal-input.js'

// 열린 단막극 연습일지 - 팀 구성 (관리 화면 '연습일지 설정')
export const rehearsalTeamsRouter = Router()

rehearsalTeamsRouter.use(requireRehearsalAccess)

function readTeamBody(body: Record<string, unknown>) {
  return {
    title: cleanText(body.title, 100),
    name: cleanText(body.name, 60),
    director: cleanText(body.director, 40),
    assistantDirector: cleanText(body.assistantDirector, 40),
    members: cleanNames(body.members),
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
  }
}

rehearsalTeamsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const teams = await RehearsalTeam.find().sort({ order: 1, createdAt: 1 }).lean()
    ok(res, teams)
  })
)

rehearsalTeamsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!res.locals.rehearsal.canManageTeams) {
      fail(res, '팀 구성은 관리자와 단막극 담당 계정만 만들 수 있습니다.', 403)
      return
    }

    const fields = readTeamBody(req.body ?? {})
    if (!fields.title || !fields.name || !fields.director) {
      fail(res, '작품명, 팀명, 연출을 입력해주세요.', 400)
      return
    }

    const team = await RehearsalTeam.create(fields)
    ok(res, team.toObject(), '팀을 만들었습니다.', 201)
  })
)

rehearsalTeamsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!res.locals.rehearsal.canManageTeams) {
      fail(res, '팀 구성은 관리자와 단막극 담당 계정만 고칠 수 있습니다.', 403)
      return
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }

    const fields = readTeamBody(req.body ?? {})
    if (!fields.title || !fields.name || !fields.director) {
      fail(res, '작품명, 팀명, 연출을 입력해주세요.', 400)
      return
    }

    // 팀원 명단을 바꿔도 이미 쓴 일지의 출석부(roster)는 그대로 남는다
    const team = await RehearsalTeam.findByIdAndUpdate(req.params.id, fields, { new: true }).lean()
    if (!team) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }
    ok(res, team, '팀 정보를 고쳤습니다.')
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
