import { Router } from 'express'
import { Gallery } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requirePermission } from '../middleware/require-admin.js'

export const galleryRouter = Router()

galleryRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Gallery.find()
      .populate('programId', 'title')
      .sort({ order: 1, createdAt: -1 })
      .lean()

    ok(res, items)
  })
)

galleryRouter.post(
  '/',
  requirePermission('gallery'),
  asyncHandler(async (req, res) => {
    const item = await Gallery.create(req.body)
    ok(res, item.toObject(), '갤러리 항목이 등록되었습니다.', 201)
  })
)

galleryRouter.put(
  '/:id',
  requirePermission('gallery'),
  asyncHandler(async (req, res) => {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean()
    if (!item) {
      fail(res, '갤러리 항목을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, item, '갤러리 항목이 수정되었습니다.')
  })
)

galleryRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const item = await Gallery.findByIdAndDelete(req.params.id)
    if (!item) {
      fail(res, '갤러리 항목을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '갤러리 항목이 삭제되었습니다.')
  })
)
