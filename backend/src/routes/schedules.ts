import { Router } from 'express'
import { Program, Schedule } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requirePermission } from '../middleware/require-admin.js'
import { canManageProgram } from '../lib/ownership.js'
import type { AuthPayload } from '../lib/auth.js'

export const schedulesRouter = Router()

function normalizeSchedule(body: Record<string, unknown>) {
  return {
    programId: body.programId,
    date: body.date,
    time: body.time || body.startTime,
    venue: body.venue,
    // 상태를 안 보내오면 '예매대기'로 둔다 (모델 기본값과 같은 값)
    seatStatus: body.seatStatus || 'pending',
    note: body.note || body.description,
  }
}

schedulesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = {}

    if (req.query.programId) {
      query.programId = req.query.programId
    }

    if (typeof req.query.month === 'string') {
      const [year, monthNum] = req.query.month.split('-').map(Number)
      query.date = {
        $gte: new Date(year, monthNum - 1, 1),
        $lte: new Date(year, monthNum, 0, 23, 59, 59),
      }
    }

    if (req.query.upcoming === 'true') {
      query.date = { $gte: new Date() }
    }

    const schedules = await Schedule.find(query)
      // runtime은 공연이 언제 끝나는지 계산해 '공연 중' 표시를 내리는 데 쓴다
      .populate('programId', 'title type company posterUrl ticketUrl venue venueAddress runtime')
      .sort({ date: 1, time: 1 })
      .lean()

    ok(res, schedules)
  })
)

// 일정은 항상 특정 작품에 딸려 있으므로, 극단 담당자는 본인 극단 작품의 일정만 다룰 수 있다.
async function canManageProgramSchedule(user: AuthPayload, programId: unknown): Promise<boolean> {
  const program = await Program.findById(programId).select('company theaterGroup type').lean<{
    company: string
    theaterGroup?: unknown
    type: string
  }>()
  if (!program) return false
  return canManageProgram(user, {
    company: program.company,
    theaterGroup: program.theaterGroup as string | null,
    type: program.type,
  })
}

schedulesRouter.post(
  '/',
  requirePermission('schedules'),
  asyncHandler(async (req, res) => {
    const body = normalizeSchedule(req.body)
    const program = await Program.findById(body.programId)

    if (!program) {
      fail(res, '해당 프로그램을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await canManageProgramSchedule(res.locals.user, body.programId))) {
      fail(res, '해당 작품의 일정을 등록할 권한이 없습니다.', 403)
      return
    }

    const schedule = await Schedule.create(body)
    ok(res, schedule.toObject(), '일정이 등록되었습니다.', 201)
  })
)

schedulesRouter.put(
  '/:id',
  requirePermission('schedules'),
  asyncHandler(async (req, res) => {
    const existing = await Schedule.findById(req.params.id).select('programId').lean<{
      programId: unknown
    }>()
    if (!existing) {
      fail(res, '일정을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await canManageProgramSchedule(res.locals.user, existing.programId))) {
      fail(res, '해당 작품의 일정을 수정할 권한이 없습니다.', 403)
      return
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      normalizeSchedule(req.body),
      { new: true }
    ).lean()

    ok(res, schedule, '일정이 수정되었습니다.')
  })
)

schedulesRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const schedule = await Schedule.findByIdAndDelete(req.params.id)
    if (!schedule) {
      fail(res, '일정을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '일정이 삭제되었습니다.')
  })
)
