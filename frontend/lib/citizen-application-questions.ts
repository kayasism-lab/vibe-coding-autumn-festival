/**
 * 시민참여 신청서의 질문 정의.
 *
 * 백엔드 `backend/src/lib/citizen-application-questions.ts`와 같은 규칙을 쓴다.
 * 한쪽만 고치면 화면과 서버가 서로 다른 검증을 하게 되므로 함께 고칠 것.
 */

/** 질문 입력 방식 */
export type CitizenQuestionType = 'yesno' | 'text' | 'textarea' | 'select' | 'checkbox'

export const CITIZEN_QUESTION_TYPES: CitizenQuestionType[] = [
  'yesno',
  'text',
  'textarea',
  'select',
  'checkbox',
]

/** 관리 화면 선택 상자에 쓰는 유형 이름과 설명 */
export const citizenQuestionTypeOptions: {
  value: CitizenQuestionType
  label: string
  hint: string
}[] = [
  { value: 'yesno', label: '예 / 아니오', hint: '둘 중 하나를 고릅니다.' },
  { value: 'text', label: '한 줄 입력', hint: '짧은 답을 직접 씁니다.' },
  { value: 'textarea', label: '여러 줄 입력', hint: '신청동기처럼 긴 답을 씁니다.' },
  { value: 'select', label: '하나 고르기', hint: '선택지 중 하나만 고릅니다.' },
  { value: 'checkbox', label: '여러 개 고르기', hint: '선택지 중 여러 개를 고릅니다.' },
]

export interface CitizenFormQuestion {
  /** 답변을 담는 키. 기본 질문은 기존 신청서 필드명과 같은 값을 쓴다 */
  id: string
  type: CitizenQuestionType
  label: string
  required: boolean
  /** select·checkbox에서 고를 수 있는 항목 */
  options?: string[]
  /** 입력칸 아래에 작게 붙는 안내 문구 */
  notice?: string
  /** text·textarea 최대 글자 수 */
  maxLength?: number
  /** 다른 질문의 답이 특정 값일 때만 보여준다 (꼬리 질문) */
  showWhen?: { questionId: string; equals: string }
}

/**
 * 담당자가 질문을 한 번도 편집하지 않았을 때 쓰는 기본 질문 세트.
 * id를 기존 신청서 필드명과 같게 두어, 접수한 답을 기존 필드에도 함께 저장한다.
 */
export const DEFAULT_CITIZEN_QUESTIONS: CitizenFormQuestion[] = [
  {
    id: 'unavailableSchedules',
    type: 'checkbox',
    label: '아래 일정 중 참여 불가한 일정이 있을 경우 체크해주세요.',
    required: false,
    options: [],
    notice: '일정 일부는 진행상황 및 전체 행사 일정에 따라 변동 될 수도 있습니다.',
  },
  {
    id: 'respectAgreement',
    type: 'yesno',
    label: '함께하는 강사 및 동료분을 존중해주는 자세가 필요합니다.',
    required: true,
  },
  {
    id: 'hasExperience',
    type: 'yesno',
    label: '연극 관련 경험이 있으신가요?',
    required: true,
  },
  {
    id: 'experienceDetail',
    type: 'textarea',
    label: '어떤 경험이 있으신가요? (1000자 이내)',
    required: true,
    maxLength: 1000,
    showWhen: { questionId: 'hasExperience', equals: 'yes' },
  },
  {
    id: 'motivation',
    type: 'textarea',
    label: '신청동기 및 각오',
    required: true,
  },
]

/** 기본 질문 id 목록. 이 id는 기존 신청서 필드와 연결돼 있어 유형을 바꾸지 못하게 막는다 */
export const DEFAULT_CITIZEN_QUESTION_IDS: string[] = DEFAULT_CITIZEN_QUESTIONS.map((q) => q.id)

/** 작품 문서에 저장되는 신청서 설정 */
export interface CitizenApplicationFormConfig {
  questions?: CitizenFormQuestion[] | null
  /** questions가 생기기 전에 저장된 일정 목록·안내 문구 (기본 질문으로 옮겨 쓴다) */
  scheduleItems?: string[] | null
  scheduleNotice?: string | null
}

function cleanStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeQuestion(raw: unknown): CitizenFormQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  const label = typeof source.label === 'string' ? source.label.trim() : ''
  const type = source.type as CitizenQuestionType
  if (!id || !label || !CITIZEN_QUESTION_TYPES.includes(type)) return null

  const question: CitizenFormQuestion = { id, type, label, required: source.required === true }
  if (type === 'select' || type === 'checkbox') question.options = cleanStrings(source.options)
  if (typeof source.notice === 'string' && source.notice.trim()) question.notice = source.notice.trim()
  if (typeof source.maxLength === 'number' && source.maxLength > 0) question.maxLength = source.maxLength

  const showWhen = source.showWhen as Record<string, unknown> | undefined
  if (showWhen && typeof showWhen.questionId === 'string' && typeof showWhen.equals === 'string') {
    question.showWhen = { questionId: showWhen.questionId, equals: showWhen.equals }
  }
  return question
}

/**
 * 작품 설정에서 실제로 신청서에 낼 질문 목록을 만든다.
 * 질문을 편집한 적이 없으면 기본 질문을 쓰되, 예전 화면에서 입력해둔 일정을 첫 질문에 넣는다.
 */
export function resolveCitizenQuestions(config?: CitizenApplicationFormConfig | null): CitizenFormQuestion[] {
  const saved = Array.isArray(config?.questions)
    ? config.questions.map(normalizeQuestion).filter((q): q is CitizenFormQuestion => q !== null)
    : []
  if (saved.length > 0) return saved

  const scheduleItems = cleanStrings(config?.scheduleItems)
  const scheduleNotice = typeof config?.scheduleNotice === 'string' ? config.scheduleNotice.trim() : ''

  return DEFAULT_CITIZEN_QUESTIONS.map((question) =>
    question.id === 'unavailableSchedules'
      ? { ...question, options: scheduleItems, notice: scheduleNotice || question.notice }
      : { ...question }
  )
}

/** 하나의 질문에 대한 답 */
export type CitizenAnswerValue = boolean | string | string[]
export type CitizenAnswers = Record<string, CitizenAnswerValue>

/** 지금 답변 상태에서 이 질문을 보여줘야 하는지 (꼬리 질문 조건 판정) */
export function isQuestionVisible(question: CitizenFormQuestion, answers: CitizenAnswers): boolean {
  // 선택지가 하나도 없는 고르기 질문은 그릴 것이 없어 숨긴다
  if ((question.type === 'select' || question.type === 'checkbox') && !question.options?.length) {
    return false
  }
  if (!question.showWhen) return true

  const target = answers[question.showWhen.questionId]
  const expected = question.showWhen.equals
  if (typeof target === 'boolean') return (target ? 'yes' : 'no') === expected
  return String(target ?? '') === expected
}

/** 지금 답변 상태에서 실제로 화면에 낼 질문만 추린다 */
export function visibleCitizenQuestions(
  questions: CitizenFormQuestion[],
  answers: CitizenAnswers
): CitizenFormQuestion[] {
  return questions.filter((question) => isQuestionVisible(question, answers))
}

/** 질문 유형에 맞는 빈 답을 만든다. 라디오는 '아직 안 고름'을 빈 문자열로 둔다 */
export function emptyCitizenAnswers(questions: CitizenFormQuestion[]): CitizenAnswers {
  const answers: CitizenAnswers = {}
  for (const question of questions) {
    answers[question.id] = question.type === 'checkbox' ? [] : ''
  }
  return answers
}

/** 필수 항목이 비었는지 확인한다. 문제가 없으면 빈 문자열 */
export function validateCitizenAnswers(
  questions: CitizenFormQuestion[],
  answers: CitizenAnswers
): string {
  for (const question of visibleCitizenQuestions(questions, answers)) {
    if (!question.required) continue
    const value = answers[question.id]
    // 예/아니오는 false('아니오')도 정상 답이라 '고르지 않음'(빈 문자열)만 걸러낸다
    const isBlank =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    if (isBlank) return `'${question.label}' 항목을 입력해주세요.`
  }
  return ''
}

/** 예전 신청서의 고정 필드 값. answers가 없던 시절에 접수된 건을 읽을 때 쓴다 */
export interface LegacyCitizenAnswerSource {
  answers?: CitizenAnswers | null
  unavailableSchedules?: string[] | null
  respectAgreement?: boolean | null
  hasExperience?: boolean | null
  experienceDetail?: string | null
  motivation?: string | null
}

/**
 * 저장된 신청서에서 답변 상태를 만든다.
 *
 * answers가 생기기 전에 접수된 신청서는 답이 고정 필드에 흩어져 있어,
 * 그대로 두면 수정 화면이 빈 칸으로 뜬다. 기본 질문 id가 옛 필드명과 같아 그대로 옮겨 담는다.
 */
export function toCitizenAnswers(
  questions: CitizenFormQuestion[],
  source: LegacyCitizenAnswerSource
): CitizenAnswers {
  const legacy: CitizenAnswers = {}
  if (Array.isArray(source.unavailableSchedules)) legacy.unavailableSchedules = source.unavailableSchedules
  if (typeof source.respectAgreement === 'boolean') legacy.respectAgreement = source.respectAgreement
  if (typeof source.hasExperience === 'boolean') legacy.hasExperience = source.hasExperience
  if (typeof source.experienceDetail === 'string') legacy.experienceDetail = source.experienceDetail
  if (typeof source.motivation === 'string') legacy.motivation = source.motivation

  const saved = source.answers && typeof source.answers === 'object' ? source.answers : {}
  // 담당자가 나중에 추가한 질문은 저장된 답이 없으므로 빈 값으로 채워 입력칸이 나오게 한다
  return { ...emptyCitizenAnswers(questions), ...legacy, ...saved }
}

/** 접수 당시 남긴 질문 문구 스냅샷 한 건 */
export interface AnsweredQuestion {
  id: string
  type: CitizenQuestionType
  label: string
  options?: string[]
}

/**
 * 관리자 화면에서 답변을 표시할 질문 목록을 정한다.
 *
 * 접수할 때 남긴 스냅샷이 있으면 그대로 쓴다. 담당자가 그 뒤 질문을 바꿨더라도
 * 신청자가 실제로 본 문구로 보여줘야 답을 제대로 읽을 수 있다.
 * 스냅샷이 없는 예전 신청서는 값이 남아 있는 기본 질문만 골라 만든다.
 */
export function resolveAnsweredQuestions(source: {
  answeredQuestions?: AnsweredQuestion[] | null
  answers?: CitizenAnswers | null
} & LegacyCitizenAnswerSource): AnsweredQuestion[] {
  if (Array.isArray(source.answeredQuestions) && source.answeredQuestions.length > 0) {
    return source.answeredQuestions
  }

  const legacy = toCitizenAnswers([], source)
  return DEFAULT_CITIZEN_QUESTIONS.filter((question) => {
    const value = legacy[question.id]
    if (value === undefined) return false
    return !(Array.isArray(value) && value.length === 0) && value !== ''
  }).map(({ id, type, label, options }) => ({ id, type, label, ...(options?.length ? { options } : {}) }))
}
