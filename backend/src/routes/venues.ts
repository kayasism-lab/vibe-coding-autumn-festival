import { Router } from 'express'
import { Venue } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const venuesRouter = Router()

venuesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query.active === 'true' ? { isActive: true } : {}
    const venues = await Venue.find(query).sort({ order: 1 })
    ok(res, venues)
  })
)

venuesRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const venue = await Venue.create(req.body)
    ok(res, venue, '공연장이 등록되었습니다.', 201)
  })
)

venuesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const venue = await Venue.findById(req.params.id)
    if (!venue) {
      fail(res, '공연장을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, venue)
  })
)

venuesRouter.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!venue) {
      fail(res, '공연장을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, venue)
  })
)

venuesRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const venue = await Venue.findByIdAndDelete(req.params.id)
    if (!venue) {
      fail(res, '공연장을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '공연장이 삭제되었습니다.')
  })
)
