import { Router } from 'express'
import { Application } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const applicationsRouter = Router()

applicationsRouter.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 20)
    const query = req.query.status ? { status: req.query.status } : {}
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Application.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Application.countDocuments(query),
    ])

    ok(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) })
  })
)

applicationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const application = await Application.create(req.body)
    ok(res, application, '참가 신청이 접수되었습니다.', 201)
  })
)

applicationsRouter.get(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id)
    if (!application) {
      fail(res, '신청을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, application)
  })
)

applicationsRouter.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )

    if (!application) {
      fail(res, '신청을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, application)
  })
)

applicationsRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const application = await Application.findByIdAndDelete(req.params.id)
    if (!application) {
      fail(res, '신청을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '신청이 삭제되었습니다.')
  })
)
