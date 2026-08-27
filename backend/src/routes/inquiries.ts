import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Inquiry } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requirePermission } from '../middleware/require-admin.js'
import { clearFailures, getBlockedMinutes, recordFailure } from '../lib/attempt-limiter.js'
import { validatePassword } from '../lib/password-policy.js'

export const inquiriesRouter = Router()

// 무차별 대입 차단용 키. 문의 건 기준으로 실패 횟수를 센다.
const attemptKey = (inquiryId: string) => `inquiry:${inquiryId}`

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
  requirePermission('inquiries'),
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
    const passwordError = validatePassword(req.body.password)
    if (passwordError) {
      fail(res, passwordError, 400)
      return
    }

    // 화면에서만 막으면 요청을 직접 보내 우회할 수 있어 서버에서도 검증한다
    if (req.body.privacyAgreed !== true) {
      fail(res, '개인정보 수집·이용에 동의해주세요.', 400)
      return
    }
    // 만 14세 미만 아동은 법정대리인 동의가 필요해 접수를 받지 않는다
    if (req.body.ageConfirmed !== true) {
      fail(res, '만 14세 이상인지 확인해주세요.', 400)
      return
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const inquiry = await Inquiry.create({
      ...req.body,
      password: hashedPassword,
      privacyAgreed: true,
      ageConfirmed: true,
      // 동의 시각은 클라이언트 값을 그대로 믿지 않고, 없으면 서버 시각으로 남긴다
      agreedAt: req.body.agreedAt ? new Date(req.body.agreedAt) : new Date(),
    })
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

    // 비밀번호 반복 대입으로 남의 문의 내용을 열람하지 못하도록 시도 횟수를 제한한다
    const key = attemptKey(req.params.id)
    const blockedMinutes = getBlockedMinutes(key)
    if (blockedMinutes !== null) {
      fail(res, `비밀번호를 여러 번 잘못 입력했습니다. ${blockedMinutes}분 후에 다시 시도해주세요.`, 429)
      return
    }

    const inquiry = await Inquiry.findById(req.params.id).lean()
    if (!inquiry) {
      fail(res, '문의를 찾을 수 없습니다.', 404)
      return
    }

    const isValid = await bcrypt.compare(req.body.password, inquiry.password)
    if (!isValid) {
      recordFailure(key)
      fail(res, '비밀번호가 일치하지 않습니다.', 401)
      return
    }
    clearFailures(key)

    const result = { ...inquiry } as Record<string, unknown>
    delete result.password
    ok(res, result)
  })
)

inquiriesRouter.put(
  '/:id/reply',
  requirePermission('inquiries'),
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
