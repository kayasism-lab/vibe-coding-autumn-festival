import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { CitizenApplication, Program } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requireAdminOrGroup } from '../middleware/require-admin.js'
import { canManageGroupResource } from '../lib/ownership.js'

export const citizenApplicationsRouter = Router()

// qna 필드 추가 이전에 생성된 구버전 문서는 qna가 없을 수 있어 항상 배열로 보정
function sanitize(application: Record<string, unknown>) {
  const { password, ...safe } = application
  return { ...safe, qna: safe.qna ?? [] }
}

// 시민참여 열린 낭독극/열린 단막극 신청 접수 (공개)
citizenApplicationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      programType,
      name,
      phone,
      email,
      residence,
      age,
      gender,
      practiceAvailable,
      respectAgreement,
      hasExperience,
      experienceDetail,
      motivation,
      password,
    } = req.body

    if (
      !['reading', 'short_play'].includes(programType) ||
      !name ||
      !phone ||
      !email ||
      !residence ||
      !age ||
      !gender ||
      typeof practiceAvailable !== 'boolean' ||
      typeof respectAgreement !== 'boolean' ||
      typeof hasExperience !== 'boolean' ||
      !motivation ||
      !password
    ) {
      fail(res, '필수 항목을 모두 입력해주세요.', 400)
      return
    }

    if (hasExperience && !experienceDetail) {
      fail(res, '경험 내용을 입력해주세요.', 400)
      return
    }

    if (experienceDetail && experienceDetail.length > 1000) {
      fail(res, '경험 내용은 1000자 이내로 입력해주세요.', 400)
      return
    }

    // 클라이언트가 programId를 직접 지정하지 못하도록 서버에서 해당 유형의 열린 프로그램을 조회
    const program = await Program.findOne({ type: programType, openForApplication: true }).lean()
    if (!program) {
      fail(res, '현재 열린 낭독극/단막극 신청을 받고 있지 않습니다.', 400)
      return
    }

    const application = await CitizenApplication.create({
      programId: program._id,
      programType,
      name,
      phone,
      email,
      residence,
      age,
      gender,
      practiceAvailable,
      respectAgreement,
      hasExperience,
      experienceDetail: hasExperience ? experienceDetail : undefined,
      motivation,
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
    delete updates.programType
    delete updates.status
    delete updates.adminNote
    delete updates.qna

    Object.assign(application, updates)
    await application.save()

    ok(res, sanitize(application.toObject()), '신청 내역이 수정되었습니다.')
  })
)

// 본인 신청 내역에 문의 남기기 (공개, 비밀번호 재확인 필요, 심사중일 때만 가능)
citizenApplicationsRouter.post(
  '/:id/qna',
  asyncHandler(async (req, res) => {
    const { password, message } = req.body
    if (!password || !message?.trim()) {
      fail(res, '비밀번호와 문의 내용을 입력해주세요.', 400)
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

    if (application.status !== 'pending') {
      fail(res, '심사가 완료된 신청은 문의를 남길 수 없습니다.', 400)
      return
    }

    // qna 필드 추가 이전에 생성된 구버전 문서 대응
    if (!application.qna) application.qna = []
    application.qna.push({ author: 'applicant', message: message.trim(), createdAt: new Date() })
    await application.save()

    ok(res, sanitize(application.toObject()), '문의가 등록되었습니다.')
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
        // lean() 조회는 스키마 default를 적용하지 않으므로 qna 필드를 직접 보정
        visible.push({ ...application, qna: application.qna ?? [] })
      }
    }

    ok(res, visible)
  })
)

// 관리자/극단 담당자가 심사중인 신청에 문의·답변 남기기
citizenApplicationsRouter.post(
  '/:id/qna/admin',
  requireAdminOrGroup,
  asyncHandler(async (req, res) => {
    const { message } = req.body
    if (!message?.trim()) {
      fail(res, '문의 내용을 입력해주세요.', 400)
      return
    }

    const application = await CitizenApplication.findById(req.params.id).populate('programId', 'company')
    if (!application) {
      fail(res, '신청 내역을 찾을 수 없습니다.', 404)
      return
    }

    const company = (application.programId as unknown as { company?: string } | null)?.company
    if (!company || !(await canManageGroupResource(res.locals.user, company))) {
      fail(res, '권한이 없습니다.', 403)
      return
    }

    if (application.status !== 'pending') {
      fail(res, '심사가 완료된 신청에는 문의를 남길 수 없습니다.', 400)
      return
    }

    // qna 필드 추가 이전에 생성된 구버전 문서 대응
    if (!application.qna) application.qna = []
    application.qna.push({ author: 'admin', message: message.trim(), createdAt: new Date() })
    await application.save()

    ok(res, sanitize(application.toObject()), '문의가 등록되었습니다.')
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
