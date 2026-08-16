import { Router } from 'express'
import { Program, TheaterGroup } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requirePermission } from '../middleware/require-admin.js'
import { canManageGroupResource, loadGroupContext } from '../lib/ownership.js'

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
  requirePermission('programs'),
  asyncHandler(async (req, res) => {
    const payload = { ...req.body }

    // 극단 담당자가 등록하면 소유 극단을 본인 극단으로 강제한다 (다른 극단 작품 등록 방지)
    if (res.locals.user.role === 'group') {
      const context = await loadGroupContext(res.locals.user)
      if (!context?.theaterGroupId) {
        fail(res, '담당 극단이 지정되지 않아 작품을 등록할 수 없습니다.', 400)
        return
      }
      payload.theaterGroup = context.theaterGroupId
      payload.company = context.theaterGroupName
    } else if (payload.theaterGroup) {
      const group = await TheaterGroup.findById(payload.theaterGroup).select('name').lean<{ name: string }>()
      if (!group) {
        fail(res, '선택한 극단을 찾을 수 없습니다.', 400)
        return
      }
    }

    const program = await Program.create(payload)
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
  requirePermission('programs'),
  asyncHandler(async (req, res) => {
    const existing = await Program.findById(req.params.id).lean()
    if (!existing) {
      fail(res, '프로그램을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await canManageGroupResource(res.locals.user, existing.company, existing.theaterGroup))) {
      fail(res, '해당 프로그램을 수정할 권한이 없습니다.', 403)
      return
    }

    const update = { ...req.body, updatedAt: new Date() }

    // 극단 담당자는 작품의 소유 극단을 바꿀 수 없다 (다른 극단으로 넘기는 것 방지)
    if (res.locals.user.role === 'group') {
      delete update.theaterGroup
      delete update.company
    }

    const program = await Program.findByIdAndUpdate(req.params.id, update, { new: true }).lean()

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
