import { Router } from 'express'
import { Program } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requireAdminOrGroup } from '../middleware/require-admin.js'
import { canManageGroupResource } from '../lib/ownership.js'

export const programsRouter = Router()

programsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = {}

    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type
    }

    if (req.query.active !== 'false') {
      query.isActive = true
    }

    const programs = await Program.find(query).sort({ order: 1, createdAt: -1 }).lean()
    ok(res, programs)
  })
)

programsRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const program = await Program.create(req.body)
    ok(res, program.toObject(), '프로그램이 등록되었습니다.', 201)
  })
)

programsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const program = await Program.findById(req.params.id).lean()
    if (!program) {
      fail(res, '프로그램을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, program)
  })
)

programsRouter.put(
  '/:id',
  requireAdminOrGroup,
  asyncHandler(async (req, res) => {
    const existing = await Program.findById(req.params.id).lean()
    if (!existing) {
      fail(res, '프로그램을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await canManageGroupResource(res.locals.user, existing.company))) {
      fail(res, '해당 프로그램을 수정할 권한이 없습니다.', 403)
      return
    }

    const program = await Program.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).lean()

    ok(res, program, '프로그램이 수정되었습니다.')
  })
)

programsRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const program = await Program.findByIdAndDelete(req.params.id)
    if (!program) {
      fail(res, '프로그램을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '프로그램이 삭제되었습니다.')
  })
)
