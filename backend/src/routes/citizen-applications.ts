import { Router } from 'express'
import type { Response } from 'express'
import type { Types } from 'mongoose'
import bcrypt from 'bcryptjs'
import { CitizenApplication, Program } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requirePermission } from '../middleware/require-admin.js'
import { canManageProgram } from '../lib/ownership.js'
import { clearFailures, getBlockedMinutes, recordFailure } from '../lib/attempt-limiter.js'
import { validatePassword } from '../lib/password-policy.js'
import {
  resolveCitizenApplicationMessage,
  resolveCitizenApplicationStatus,
} from '../lib/citizen-application-status.js'
import {
  DEFAULT_CITIZEN_QUESTION_IDS,
  resolveCitizenQuestions,
} from '../lib/citizen-application-questions.js'
import { normalizeCitizenAnswers, snapshotQuestions } from '../lib/citizen-application-answers.js'

export const citizenApplicationsRouter = Router()

// 시민참여 행사(낭독극·단막극)의 신청 가능 최소 연령.
// 프론트(components/citizen-application-form.tsx)의 MIN_AGE와 같은 값을 유지해야 한다.
const MIN_APPLICANT_AGE = 20

// 무차별 대입 차단용 키. 신청 건마다가 아니라 대상 전화번호 기준으로 센다.
const attemptKey = (phone: string) => `citizen:${phone}`

// qna 필드 추가 이전에 생성된 구버전 문서는 qna가 없을 수 있어 항상 배열로 보정
function sanitize(application: Record<string, unknown>) {
  const { password, ...safe } = application
  return { ...safe, qna: safe.qna ?? [] }
}

// 신청 건 하나를 불러오면서 지금 로그인한 계정이 그것을 다룰 수 있는지까지 확인한다.
// requirePermission은 '메뉴에 들어올 수 있는가'까지만 보므로, 낭독극 담당자가 단막극
// 신청을 건드리지 못하게 작품의 공연 유형을 여기서 한 번 더 대조한다(관리자는 항상 통과).
// 찾지 못했거나 권한이 없으면 이 함수가 응답까지 마치고 null을 돌려준다.
async function findManageableApplication(res: Response, id: string) {
  const application = await CitizenApplication.findById(id).populate(
    'programId',
    'company theaterGroup type'
  )
  if (!application) {
    fail(res, '신청 내역을 찾을 수 없습니다.', 404)
    return null
  }

  const program = application.programId as unknown as {
    company?: string
    theaterGroup?: Types.ObjectId | string | null
    type?: string
  } | null
  if (
    !program?.company ||
    !program.type ||
    !(await canManageProgram(res.locals.user, {
      company: program.company,
      theaterGroup: program.theaterGroup,
      type: program.type,
    }))
  ) {
    fail(res, '권한이 없습니다.', 403)
    return null
  }

  return application
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
      answers,
      password,
      privacyAgreed,
      agreedAt,
    } = req.body

    // 이름·연락처 같은 고정 항목만 여기서 본다.
    // 질문 항목은 작품마다 구성이 달라, 작품을 찾은 뒤 질문 정의를 기준으로 따로 검증한다
    if (
      !['reading', 'short_play'].includes(programType) ||
      !name ||
      !phone ||
      !email ||
      !residence ||
      !age ||
      !gender ||
      !password
    ) {
      fail(res, '필수 항목을 모두 입력해주세요.', 400)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      fail(res, passwordError, 400)
      return
    }

    // 화면에서만 막으면 요청을 직접 보내 우회할 수 있어 서버에서도 검증한다
    if (privacyAgreed !== true) {
      fail(res, '개인정보 수집·이용에 동의해주세요.', 400)
      return
    }

    // 시민참여 행사(낭독극·단막극)는 만 20세 이상만 신청할 수 있다
    if (Number(age) < MIN_APPLICANT_AGE) {
      fail(res, `시민참여 행사는 만 ${MIN_APPLICANT_AGE}세 이상만 신청하실 수 있습니다.`, 400)
      return
    }

    // 클라이언트가 programId를 직접 지정하지 못하도록 서버에서 해당 유형의 프로그램을 조회한다
    const program = await Program.findOne({ type: programType, isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean()
    if (!program) {
      // 해당 유형의 작품 자체가 아직 없으면 '준비중'으로 안내한다
      fail(res, resolveCitizenApplicationMessage({}, 'preparing'), 400)
      return
    }

    // 화면에서 신청 버튼을 감춰도 요청은 직접 보낼 수 있으므로 접수 상태를 서버에서 다시 본다.
    // 안내 문구는 화면과 같은 규칙으로 골라 두 곳의 말이 어긋나지 않게 한다
    const applicationStatus = resolveCitizenApplicationStatus(program)
    if (applicationStatus !== 'open') {
      fail(res, resolveCitizenApplicationMessage(program, applicationStatus), 400)
      return
    }

    // 담당자가 작품 관리 화면에서 만든 질문을 기준으로 답을 정리·검증한다.
    // 화면에서 막아도 요청은 직접 보낼 수 있어 필수 입력·선택지 검사는 여기서 다시 한다
    const questions = resolveCitizenQuestions(program.applicationForm)
    const normalized = normalizeCitizenAnswers(questions, answers ?? req.body)
    if (normalized.error) {
      fail(res, normalized.error, 400)
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
      answers: normalized.answers,
      answeredQuestions: snapshotQuestions(questions, normalized.answers),
      // 기본 질문의 답은 예전 필드에도 같이 넣는다.
      // 관리자 조회 화면과 이미 접수된 신청서가 같은 자리에서 값을 읽을 수 있어야 한다
      ...normalized.legacyFields,
      password: await bcrypt.hash(password, 10),
      // 동의 시각은 클라이언트 값을 그대로 믿지 않고, 없으면 서버 시각으로 남긴다
      privacyAgreed: true,
      agreedAt: agreedAt ? new Date(agreedAt) : new Date(),
    })

    ok(res, sanitize(application.toObject()), '신청이 접수되었습니다.', 201)
  })
)

// 전화번호 + 비밀번호로 본인 신청 내역 조회 (공개)
citizenApplicationsRouter.post(
  '/lookup',
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body
    // 문자열이 아니면(예: { $ne: null }) 막는다. 필터로 흘러가 전체 신청자를
    // 대상으로 비밀번호가 대입되는 것을 차단한다
    if (typeof phone !== 'string' || typeof password !== 'string' || !phone || !password) {
      fail(res, '전화번호와 비밀번호를 입력해주세요.', 400)
      return
    }

    // 전화번호는 비밀 값이 아니라, 시도 제한이 없으면 비밀번호를 반복 대입해
    // 남의 개인정보를 열람할 수 있다. 실패가 쌓이면 일정 시간 막는다.
    const blockedMinutes = getBlockedMinutes(attemptKey(phone))
    if (blockedMinutes !== null) {
      fail(res, `비밀번호를 여러 번 잘못 입력했습니다. ${blockedMinutes}분 후에 다시 시도해주세요.`, 429)
      return
    }

    const candidates = await CitizenApplication.find({ phone }).populate('programId', 'title')

    for (const candidate of candidates) {
      if (await bcrypt.compare(password, candidate.password)) {
        clearFailures(attemptKey(phone))
        ok(res, sanitize(candidate.toObject()))
        return
      }
    }

    recordFailure(attemptKey(phone))
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

    // 조회와 마찬가지로 비밀번호 반복 대입을 막는다 (여기서는 신청 건 기준)
    const key = attemptKey(req.params.id)
    const blockedMinutes = getBlockedMinutes(key)
    if (blockedMinutes !== null) {
      fail(res, `비밀번호를 여러 번 잘못 입력했습니다. ${blockedMinutes}분 후에 다시 시도해주세요.`, 429)
      return
    }

    const application = await CitizenApplication.findById(req.params.id)
    if (!application) {
      fail(res, '신청 내역을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await bcrypt.compare(password, application.password))) {
      recordFailure(key)
      fail(res, '비밀번호가 일치하지 않습니다.', 401)
      return
    }
    clearFailures(key)

    // 블랙리스트 대신 화이트리스트로 바꾼다. 신청자가 고칠 수 있는 값만 반영해
    // 동의 기록(privacyAgreed·agreedAt)이나 연락처 조회키(phone)를 임의로 덮어쓰지 못하게 한다.
    // 화면(apply/status)이 실제로 보내는 항목과 일치시킨다
    const editableFields = ['email', 'residence', 'age', 'gender'] as const
    for (const field of editableFields) {
      if (updates[field] !== undefined) {
        ;(application as Record<string, unknown>)[field] = updates[field]
      }
    }

    // 질문 항목은 작품에 저장된 질문 정의를 기준으로 다시 검증한다.
    // 접수 때와 같은 규칙을 써야 수정으로 필수 항목을 비우고 빠져나가는 일이 없다
    if (updates.answers !== undefined) {
      const program = await Program.findById(application.programId).lean()
      const questions = resolveCitizenQuestions(program?.applicationForm)
      const normalized = normalizeCitizenAnswers(questions, updates.answers)
      if (normalized.error) {
        fail(res, normalized.error, 400)
        return
      }

      application.answers = normalized.answers
      application.answeredQuestions = snapshotQuestions(questions, normalized.answers)
      // 기본 질문의 답은 예전 필드에도 함께 반영한다.
      // 이번 수정에서 답이 빠진 기본 질문은 값을 지워, 화면과 저장값이 어긋나지 않게 한다
      for (const id of DEFAULT_CITIZEN_QUESTION_IDS) {
        ;(application as Record<string, unknown>)[id] = normalized.legacyFields[id]
      }
    }

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

    // 여기도 비밀번호를 확인하므로 같은 방식으로 반복 대입을 막는다
    const key = attemptKey(req.params.id)
    const blockedMinutes = getBlockedMinutes(key)
    if (blockedMinutes !== null) {
      fail(res, `비밀번호를 여러 번 잘못 입력했습니다. ${blockedMinutes}분 후에 다시 시도해주세요.`, 429)
      return
    }

    const application = await CitizenApplication.findById(req.params.id)
    if (!application) {
      fail(res, '신청 내역을 찾을 수 없습니다.', 404)
      return
    }

    if (!(await bcrypt.compare(password, application.password))) {
      recordFailure(key)
      fail(res, '비밀번호가 일치하지 않습니다.', 401)
      return
    }
    clearFailures(key)

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

// 관리자/담당 계정용 목록.
// 낭독극·단막극 담당 계정(programType)은 본인 담당 유형 신청만, 극단 담당자는 소유 극단이
// 없는 이 데이터를 애초에 볼 일이 없다(requirePermission이 먼저 걸러줌).
citizenApplicationsRouter.get(
  '/',
  requirePermission('citizen-applications'),
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = {}
    if (req.query.programId) query.programId = req.query.programId

    const applications = await CitizenApplication.find(query)
      .select('-password')
      .populate('programId', 'title company theaterGroup type')
      .sort({ createdAt: -1 })
      .lean()

    const visible = []
    for (const application of applications) {
      const program = application.programId as unknown as {
        company?: string
        theaterGroup?: Types.ObjectId | string | null
        type?: string
      } | null
      if (
        program?.company &&
        program.type &&
        (await canManageProgram(res.locals.user, {
          company: program.company,
          theaterGroup: program.theaterGroup,
          type: program.type,
        }))
      ) {
        // lean() 조회는 스키마 default를 적용하지 않으므로 qna 필드를 직접 보정
        visible.push({ ...application, qna: application.qna ?? [] })
      }
    }

    ok(res, visible)
  })
)

// 관리자/담당 계정이 심사중인 신청에 문의·답변 남기기
citizenApplicationsRouter.post(
  '/:id/qna/admin',
  requirePermission('citizen-applications'),
  asyncHandler(async (req, res) => {
    const { message } = req.body
    if (!message?.trim()) {
      fail(res, '문의 내용을 입력해주세요.', 400)
      return
    }

    const application = await findManageableApplication(res, req.params.id)
    if (!application) return

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

// 신청 승인/반려.
// 총괄 관리자와, 그 공연 유형을 맡은 담당 계정(낭독극·단막극)이 할 수 있다.
// 담당 계정이 자기 유형이 아닌 신청을 건드리는 것은 findManageableApplication이 막는다.
citizenApplicationsRouter.put(
  '/:id/status',
  requirePermission('citizen-applications'),
  asyncHandler(async (req, res) => {
    const { status, adminNote } = req.body
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      fail(res, '올바르지 않은 상태값입니다.', 400)
      return
    }

    const application = await findManageableApplication(res, req.params.id)
    if (!application) return

    application.status = status
    // 메모를 함께 보내지 않은 요청이 기존 메모를 지우지 않도록 값이 있을 때만 반영한다
    if (adminNote !== undefined) application.adminNote = adminNote
    await application.save()

    ok(res, sanitize(application.toObject()), '신청 상태가 변경되었습니다.')
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
