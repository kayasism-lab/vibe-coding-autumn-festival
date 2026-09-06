import { Router } from 'express'
import { Application } from '../models/index.js'
import { asyncHandler, clampLimit, clampPage, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const applicationsRouter = Router()

applicationsRouter.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const page = clampPage(req.query.page)
    const limit = clampLimit(req.query.limit, 20)
    const query = req.query.status ? { status: String(req.query.status) } : {}
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
    // 요청 본문을 통째로 넘기면 status·adminNote까지 조작되어 심사 없이
    // '승인' 상태의 신청을 만들 수 있다. 접수 폼이 보내는 필드만 골라 저장한다
    const application = await Application.create({
      groupName: req.body.groupName,
      representative: req.body.representative,
      email: req.body.email,
      phone: req.body.phone,
      memberCount: req.body.memberCount,
      // 첨부는 문자열 배열만 허용한다
      attachmentUrls: Array.isArray(req.body.attachmentUrls)
        ? req.body.attachmentUrls.filter((url: unknown): url is string => typeof url === 'string')
        : [],
      // status는 스키마 기본값(pending)으로만 시작하고, adminNote는 관리자만 설정한다
    })
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
