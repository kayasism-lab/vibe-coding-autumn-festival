import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { CitizenApplication, Program } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requireAdminOrGroup } from '../middleware/require-admin.js'
import { canManageGroupResource } from '../lib/ownership.js'

export const citizenApplicationsRouter = Router()

function sanitize(application: Record<string, unknown>) {
  const { password, ...safe } = application
  return safe
}

// 시민참여 열린 낭독극/열린 단막극 신청 접수 (공개)
citizenApplicationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { programId, name, phone, email, region, motivation, password } = req.body

    if (!programId || !name || !phone || !email || !region?.sido || !region?.gu || !motivation || !password) {
      fail(res, '필수 항목을 모두 입력해주세요.', 400)
      return
    }

    const program = await Program.findById(programId).lean()
    if (!program || !program.openForApplication) {
      fail(res, '시민 참여 신청을 받지 않는 프로그램입니다.', 400)
      return
    }

    const application = await CitizenApplication.create({
      ...req.body,
      password: await bcrypt.hash(password, 10),
    })

    ok(res, sanitize(application.toObject()), '신청이 접수되었습니다.', 201)
  })
)

// 전화번호 + 비밀번호로 본인 신청 내역 조회 (공개)
citizenApplicationsRouter.post(
  '/lookup',
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body
    if (!phone || !password) {
      fail(res, '전화번호와 비밀번호를 입력해주세요.', 400)
      return
    }

    const candidates = await CitizenApplication.find({ phone }).populate('programId', 'title')

    for (const candidate of candidates) {
      if (await bcrypt.compare(password, candidate.password)) {
        ok(res, sanitize(candidate.toObject()))
        return
      }
    }

    fail(res, '일치하는 신청 내역을 찾을 수 없습니다.', 404)
  })
)

// 본인 신청 내역 수정 (공개, 비밀번호 재확인 필요)
citizenApplicationsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { password, ...updates } = req.body
    if (!password) {
      fail(res, '비밀번호를 입력해주세요.', 400)
      return
    }

    const application = await CitizenApplication.findById(req.params.id)
    if (!application) {
      fail(res, '신청 내역을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await bcrypt.compare(password, application.password))) {
      fail(res, '비밀번호가 일치하지 않습니다.', 401)
      return
    }

    delete updates.programId
    delete updates.status
    delete updates.adminNote

    Object.assign(application, updates)
    await application.save()

    ok(res, sanitize(application.toObject()), '신청 내역이 수정되었습니다.')
  })
)

// 관리자/극단 담당자용 목록 (극단 담당자는 본인 소속 프로그램 신청만 조회 가능)
citizenApplicationsRouter.get(
  '/',
  requireAdminOrGroup,
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = {}
    if (req.query.programId) query.programId = req.query.programId

    const applications = await CitizenApplication.find(query)
      .select('-password')
      .populate('programId', 'title company')
      .sort({ createdAt: -1 })
      .lean()

    const visible = []
    for (const application of applications) {
      const company = (application.programId as unknown as { company?: string } | null)?.company
      if (company && (await canManageGroupResource(res.locals.user, company))) {
        visible.push(application)
      }
    }

    ok(res, visible)
  })
)

// 신청 승인/반려 (총괄 관리자 전용)
citizenApplicationsRouter.put(
  '/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, adminNote } = req.body
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      fail(res, '올바르지 않은 상태값입니다.', 400)
      return
    }

    const application = await CitizenApplication.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    )
      .select('-password')
      .lean()

    if (!application) {
      fail(res, '신청 내역을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, application, '신청 상태가 변경되었습니다.')
  })
)

citizenApplicationsRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const application = await CitizenApplication.findByIdAndDelete(req.params.id)
    if (!application) {
      fail(res, '신청 내역을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '신청 내역이 삭제되었습니다.')
  })
)
