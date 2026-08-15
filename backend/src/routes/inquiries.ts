import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Inquiry } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const inquiriesRouter = Router()

inquiriesRouter.get(
  '/public',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 20)
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Inquiry.find()
        .select('title name status isPrivate createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(),
    ])

    ok(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) })
  })
)

inquiriesRouter.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 10)
    const query = req.query.status && req.query.status !== 'all' ? { status: req.query.status } : {}
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Inquiry.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(query),
    ])

    ok(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) })
  })
)

inquiriesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const inquiry = await Inquiry.create({ ...req.body, password: hashedPassword })
    const result = inquiry.toObject() as Record<string, unknown>
    delete result.password

    ok(res, result, '문의가 등록되었습니다.', 201)
  })
)

inquiriesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const inquiry = await Inquiry.findById(req.params.id).select('-password').lean()
    if (!inquiry) {
      fail(res, '문의를 찾을 수 없습니다.', 404)
      return
    }

    if (inquiry.isPrivate) {
      ok(res, {
        _id: inquiry._id,
        title: inquiry.title,
        name: inquiry.name,
        status: inquiry.status,
        isPrivate: true,
        createdAt: inquiry.createdAt,
        content: '',
        email: '',
      })
      return
    }

    ok(res, inquiry)
  })
)

inquiriesRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id)
    if (!inquiry) {
      fail(res, '문의를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '문의가 삭제되었습니다.')
  })
)

inquiriesRouter.post(
  '/:id/verify',
  asyncHandler(async (req, res) => {
    if (!req.body.password) {
      fail(res, '비밀번호를 입력해주세요.', 400)
      return
    }

    const inquiry = await Inquiry.findById(req.params.id).lean()
    if (!inquiry) {
      fail(res, '문의를 찾을 수 없습니다.', 404)
      return
    }

    const isValid = await bcrypt.compare(req.body.password, inquiry.password)
    if (!isValid) {
      fail(res, '비밀번호가 일치하지 않습니다.', 401)
      return
    }

    const result = { ...inquiry } as Record<string, unknown>
    delete result.password
    ok(res, result)
  })
)

inquiriesRouter.put(
  '/:id/reply',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!req.body.content) {
      fail(res, '답변 내용을 입력해주세요.', 400)
      return
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        status: 'answered',
        reply: { content: req.body.content, repliedAt: new Date() },
      },
      { new: true }
    )
      .select('-password')
      .lean()

    if (!inquiry) {
      fail(res, '문의를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, inquiry, '답변이 등록되었습니다.')
  })
)
