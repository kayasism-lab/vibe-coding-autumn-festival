import { Router } from 'express'
import { Notice } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const noticesRouter = Router()

noticesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 10)
    const query: Record<string, unknown> = {}

    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category
    }

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      Notice.find(query).sort({ isPinned: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notice.countDocuments(query),
    ])

    ok(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) })
  })
)

noticesRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const notice = await Notice.create(req.body)
    ok(res, notice.toObject(), '공지사항이 등록되었습니다.', 201)
  })
)

noticesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean()

    if (!notice) {
      fail(res, '공지사항을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, notice)
  })
)

noticesRouter.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).lean()

    if (!notice) {
      fail(res, '공지사항을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, notice, '공지사항이 수정되었습니다.')
  })
)

noticesRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const notice = await Notice.findByIdAndDelete(req.params.id)
    if (!notice) {
      fail(res, '공지사항을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '공지사항이 삭제되었습니다.')
  })
)
