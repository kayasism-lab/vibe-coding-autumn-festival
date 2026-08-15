import { Router } from 'express'
import { TheaterGroup } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requireAdminOrGroup } from '../middleware/require-admin.js'
import { canManageGroupResource } from '../lib/ownership.js'

export const theaterGroupsRouter = Router()

theaterGroupsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query.active === 'true' ? { isActive: true } : {}
    const groups = await TheaterGroup.find(query).sort({ order: 1 })
    ok(res, groups)
  })
)

theaterGroupsRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await TheaterGroup.create(req.body)
    ok(res, group, '극단이 등록되었습니다.', 201)
  })
)

theaterGroupsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const group = await TheaterGroup.findById(req.params.id)
    if (!group) {
      fail(res, '극단을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, group)
  })
)

theaterGroupsRouter.put(
  '/:id',
  requireAdminOrGroup,
  asyncHandler(async (req, res) => {
    const existing = await TheaterGroup.findById(req.params.id)
    if (!existing) {
      fail(res, '극단을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await canManageGroupResource(res.locals.user, existing.name))) {
      fail(res, '해당 극단 정보를 수정할 권한이 없습니다.', 403)
      return
    }

    const group = await TheaterGroup.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )

    ok(res, group)
  })
)

theaterGroupsRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await TheaterGroup.findByIdAndDelete(req.params.id)
    if (!group) {
      fail(res, '극단을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '극단이 삭제되었습니다.')
  })
)
