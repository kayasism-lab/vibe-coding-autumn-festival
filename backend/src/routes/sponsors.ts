import { Router } from 'express'
import { Sponsor } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const sponsorsRouter = Router()

sponsorsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sponsors = await Sponsor.find().sort({ tier: 1, order: 1, createdAt: -1 }).lean()
    ok(res, sponsors)
  })
)

sponsorsRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const sponsor = await Sponsor.create(req.body)
    ok(res, sponsor.toObject(), '후원사가 등록되었습니다.', 201)
  })
)

sponsorsRouter.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean()
    if (!sponsor) {
      fail(res, '후원사를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, sponsor, '후원사가 수정되었습니다.')
  })
)

sponsorsRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id)
    if (!sponsor) {
      fail(res, '후원사를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '후원사가 삭제되었습니다.')
  })
)
