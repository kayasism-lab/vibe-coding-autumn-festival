import { Router } from 'express'
import { Program, Schedule } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const schedulesRouter = Router()

function normalizeSchedule(body: Record<string, unknown>) {
  return {
    programId: body.programId,
    date: body.date,
    time: body.time || body.startTime,
    venue: body.venue,
    seatStatus: body.seatStatus || 'available',
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
      .populate('programId', 'title type company posterUrl ticketUrl venue venueAddress')
      .sort({ date: 1, time: 1 })
      .lean()

    ok(res, schedules)
  })
)

schedulesRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = normalizeSchedule(req.body)
    const program = await Program.findById(body.programId)

    if (!program) {
      fail(res, '해당 프로그램을 찾을 수 없습니다.', 404)
      return
    }

    const schedule = await Schedule.create(body)
    ok(res, schedule.toObject(), '일정이 등록되었습니다.', 201)
  })
)

schedulesRouter.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      normalizeSchedule(req.body),
      { new: true }
    ).lean()

    if (!schedule) {
      fail(res, '일정을 찾을 수 없습니다.', 404)
      return
    }

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
