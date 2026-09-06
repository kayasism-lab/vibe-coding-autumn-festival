/**
 * 시민참여(열린 낭독극·열린 단막극) 신청서의 질문 정의.
 *
 * 질문 문구와 항목 구성은 해마다 바뀌는데 코드에 박아두면 담당자가 손댈 수 없어,
 * 작품 문서(`applicationForm.questions`)에 저장하고 작품 관리 화면에서 편집한다.
 *
 * 프론트 `frontend/lib/citizen-application-questions.ts`와 같은 규칙을 쓴다.
 * 한쪽만 고치면 화면과 서버가 서로 다른 검증을 하게 되므로 함께 고칠 것.
 */

/** 질문 입력 방식 */
export type CitizenQuestionType = 'yesno' | 'text' | 'textarea' | 'select' | 'checkbox'

/** 모델 enum과 화면 선택 상자에서 함께 쓰는 값 목록 */
export const CITIZEN_QUESTION_TYPES: CitizenQuestionType[] = [
  'yesno',
  'text',
  'textarea',
  'select',
  'checkbox',
]

export interface CitizenFormQuestion {
  /** 답변을 담는 키. 기본 질문은 기존 신청서 필드명과 같은 값을 쓴다 */
  id: string
  type: CitizenQuestionType
  /** 신청서에 보이는 질문 문구 */
  label: string
  required: boolean
  /** select·checkbox에서 고를 수 있는 항목 */
  options?: string[]
  /** 입력칸 아래에 작게 붙는 안내 문구 */
  notice?: string
  /** text·textarea 최대 글자 수 */
  maxLength?: number
  /**
   * 다른 질문의 답이 특정 값일 때만 이 질문을 보여준다.
   * '연극 경험이 있다'고 답한 사람에게만 경험 내용을 묻는 식의 꼬리 질문에 쓴다.
   */
  showWhen?: { questionId: string; equals: string }
}

/**
 * 담당자가 질문을 한 번도 편집하지 않았을 때 쓰는 기본 질문 세트.
 *
 * id를 기존 신청서 필드명과 똑같이 둔 이유:
 * 접수할 때 답을 기존 필드에도 같이 저장해, 예전에 받은 신청서와
 * 관리자 조회 화면이 지금까지와 똑같이 동작하게 하려는 것이다.
 */
export const DEFAULT_CITIZEN_QUESTIONS: CitizenFormQuestion[] = [
  {
    id: 'unavailableSchedules',
    type: 'checkbox',
    label: '아래 일정 중 참여 불가한 일정이 있을 경우 체크해주세요.',
    // 전부 참여 가능하면 아무것도 고르지 않는 것이 정상이라 필수가 아니다
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

/** 기본 질문 id 목록. 이 id의 답은 기존 신청서 필드에도 함께 저장한다 */
export const DEFAULT_CITIZEN_QUESTION_IDS = DEFAULT_CITIZEN_QUESTIONS.map((question) => question.id)

/** 작품 문서에 저장되는 신청서 설정 */
export interface CitizenApplicationFormConfig {
  questions?: CitizenFormQuestion[] | null
  /**
   * questions가 생기기 전에 저장된 일정 목록·안내 문구.
   * 담당자가 입력해둔 값이 사라지지 않도록 기본 질문으로 옮겨 쓴다.
   */
  scheduleItems?: string[] | null
  scheduleNotice?: string | null
}

/** 문자열 배열에서 빈 값과 앞뒤 공백을 걷어낸다 */
function cleanStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** 저장된 질문 한 건을 화면·검증에서 바로 쓸 수 있는 모양으로 정리한다 */
function normalizeQuestion(raw: unknown): CitizenFormQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  const label = typeof source.label === 'string' ? source.label.trim() : ''
  const type = source.type as CitizenQuestionType
  // 문구가 비었거나 알 수 없는 유형이면 화면에 그릴 수 없으므로 버린다
  if (!id || !label || !CITIZEN_QUESTION_TYPES.includes(type)) return null

  const question: CitizenFormQuestion = {
    id,
    type,
    label,
    required: source.required === true,
  }

  if (type === 'select' || type === 'checkbox') {
    question.options = cleanStrings(source.options)
  }
  if (typeof source.notice === 'string' && source.notice.trim()) {
    question.notice = source.notice.trim()
  }
  if (typeof source.maxLength === 'number' && source.maxLength > 0) {
    question.maxLength = source.maxLength
  }

  const showWhen = source.showWhen as Record<string, unknown> | undefined
  if (showWhen && typeof showWhen.questionId === 'string' && typeof showWhen.equals === 'string') {
    question.showWhen = { questionId: showWhen.questionId, equals: showWhen.equals }
  }

  return question
}

/**
 * 작품 설정에서 실제로 신청서에 낼 질문 목록을 만든다.
 *
 * 질문을 한 번도 편집하지 않은 작품에는 기본 질문을 쓰되,
 * 예전 화면에서 입력해둔 일정 목록·안내 문구를 첫 질문에 넣어준다.
 * 이 대체 처리가 없으면 담당자가 등록한 일정이 갑자기 사라진 것처럼 보인다.
 */
export function resolveCitizenQuestions(config?: CitizenApplicationFormConfig | null): CitizenFormQuestion[] {
  const saved = Array.isArray(config?.questions)
    ? config.questions.map(normalizeQuestion).filter((question): question is CitizenFormQuestion => question !== null)
    : []
  if (saved.length > 0) return saved

  const scheduleItems = cleanStrings(config?.scheduleItems)
  const scheduleNotice = typeof config?.scheduleNotice === 'string' ? config.scheduleNotice.trim() : ''

  return DEFAULT_CITIZEN_QUESTIONS.map((question) => {
    if (question.id !== 'unavailableSchedules') return { ...question }
    return {
      ...question,
      options: scheduleItems,
      notice: scheduleNotice || question.notice,
    }
  })
}

/** 지금 답변 상태에서 이 질문을 보여줘야 하는지 (꼬리 질문 조건 판정) */
export function isQuestionVisible(
  question: CitizenFormQuestion,
  answers: Record<string, unknown>
): boolean {
  // 선택지가 하나도 없는 고르기 질문은 그릴 것이 없어 숨긴다
  if ((question.type === 'select' || question.type === 'checkbox') && !question.options?.length) {
    return false
  }
  if (!question.showWhen) return true

  const target = answers[question.showWhen.questionId]
  const expected = question.showWhen.equals
  // 예/아니오 답은 boolean으로 저장돼 있어 'yes'/'no' 문자열과 맞춰본다
  if (typeof target === 'boolean') return (target ? 'yes' : 'no') === expected
  return String(target ?? '') === expected
}
