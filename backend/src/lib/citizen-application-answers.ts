/**
 * 신청서 답변을 정리하고 검증한다.
 *
 * 질문 구성이 작품마다 달라졌으므로, 답변도 고정 필드가 아니라
 * `answers`(질문 id -> 답) 형태로 받는다. 화면에서 막아도 요청은 직접 보낼 수 있어
 * 필수 입력·선택지 검증은 반드시 서버에서 다시 한다.
 */
import {
  DEFAULT_CITIZEN_QUESTION_IDS,
  isQuestionVisible,
  type CitizenFormQuestion,
} from './citizen-application-questions.js'

/** 하나의 질문에 대한 답. 유형에 따라 모양이 다르다 */
export type CitizenAnswerValue = boolean | string | string[]

/** 답이 비어 있는지 판정한다. false('아니오')는 비어 있는 것이 아니다 */
function isEmpty(value: CitizenAnswerValue | undefined): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * 들어온 값을 질문 유형에 맞는 모양으로 바꾼다.
 * 유형에 맞지 않는 값(객체 등)이 섞여 오면 undefined를 돌려 저장하지 않는다.
 */
function normalizeAnswer(question: CitizenFormQuestion, raw: unknown): CitizenAnswerValue | undefined {
  switch (question.type) {
    case 'yesno':
      if (typeof raw === 'boolean') return raw
      // 화면에서 라디오 값('yes'/'no')이 그대로 올 수 있어 함께 받아준다
      if (raw === 'yes') return true
      if (raw === 'no') return false
      return undefined
    case 'text':
    case 'textarea': {
      if (typeof raw !== 'string') return undefined
      const text = raw.trim()
      return question.maxLength ? text.slice(0, question.maxLength) : text
    }
    case 'select': {
      if (typeof raw !== 'string') return undefined
      // 선택지에 없는 값은 담당자가 만든 항목이 아니므로 버린다
      return question.options?.includes(raw) ? raw : undefined
    }
    case 'checkbox': {
      if (!Array.isArray(raw)) return undefined
      const picked = raw.filter((item): item is string => typeof item === 'string')
      // 원래 선택지 순서를 지켜야 관리자가 볼 때도 등록한 순서대로 보인다
      return (question.options ?? []).filter((option) => picked.includes(option))
    }
    default:
      return undefined
  }
}

export interface NormalizedAnswers {
  /** 질문 id -> 정리된 답 */
  answers: Record<string, CitizenAnswerValue>
  /** 기본 질문의 답. 기존 신청서 필드에 그대로 저장할 값 */
  legacyFields: Record<string, CitizenAnswerValue>
  /** 필수 입력이 빠졌을 때의 안내 문구. 없으면 통과 */
  error?: string
}

/**
 * 질문 정의를 기준으로 답변을 정리·검증한다.
 *
 * 조건이 맞지 않아 화면에 나오지 않는 꼬리 질문은 검증도 저장도 하지 않는다.
 * (경험이 없다고 답한 사람에게 경험 내용을 요구하면 접수 자체가 막힌다)
 */
export function normalizeCitizenAnswers(
  questions: CitizenFormQuestion[],
  raw: unknown
): NormalizedAnswers {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const answers: Record<string, CitizenAnswerValue> = {}

  for (const question of questions) {
    // 앞 질문의 답에 따라 보일지가 정해지므로, 지금까지 정리한 답으로 판정한다
    if (!isQuestionVisible(question, answers)) continue

    const value = normalizeAnswer(question, source[question.id])
    if (isEmpty(value)) {
      if (question.required) {
        return { answers, legacyFields: {}, error: `'${question.label}' 항목을 입력해주세요.` }
      }
      // 값이 없는 선택 항목은 저장하지 않는다 (빈 값이 쌓이면 조회 화면이 지저분해진다)
      if (value !== undefined) answers[question.id] = value
      continue
    }
    answers[question.id] = value as CitizenAnswerValue
  }

  const legacyFields: Record<string, CitizenAnswerValue> = {}
  for (const id of DEFAULT_CITIZEN_QUESTION_IDS) {
    if (answers[id] !== undefined) legacyFields[id] = answers[id]
  }

  return { answers, legacyFields }
}

/**
 * 접수 당시의 질문 문구를 함께 남긴다.
 *
 * 담당자가 나중에 질문을 고치거나 지우면 예전 답이 무슨 질문에 대한 것인지
 * 알 수 없게 되므로, 신청 시점의 문구·유형·선택지를 신청서에 박아둔다.
 */
export function snapshotQuestions(
  questions: CitizenFormQuestion[],
  answers: Record<string, CitizenAnswerValue>
): Pick<CitizenFormQuestion, 'id' | 'type' | 'label' | 'options'>[] {
  return questions
    .filter((question) => answers[question.id] !== undefined)
    .map(({ id, type, label, options }) => ({ id, type, label, ...(options?.length ? { options } : {}) }))
}
