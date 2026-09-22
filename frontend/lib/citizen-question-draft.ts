/**
 * 관리 화면에서 질문을 편집할 때 쓰는 중간 형태.
 *
 * 저장 형태(CitizenFormQuestion)는 선택지를 배열로 갖는데, 화면에서는 여러 줄 입력으로 받는다.
 * 입력 중간에 배열로 바꿔버리면 빈 줄을 지우는 과정에서 커서가 튀므로,
 * 편집하는 동안은 문자열 그대로 들고 있다가 저장할 때 한 번에 배열로 바꾼다.
 */
import {
  DEFAULT_CITIZEN_QUESTION_IDS,
  type CitizenFormQuestion,
  type CitizenQuestionType,
} from '@/lib/citizen-application-questions'

export interface QuestionDraft {
  /** 답변을 담는 키. 한 번 만들면 바꾸지 않는다 (바꾸면 이미 받은 답과 연결이 끊긴다) */
  id: string
  type: CitizenQuestionType
  label: string
  required: boolean
  /** 선택지를 한 줄에 하나씩 적은 문자열 */
  optionsText: string
  notice: string
  maxLength?: number
  showWhen?: { questionId: string; equals: string }
}

/** 기본 질문인지. 기본 질문은 기존 신청서 필드와 연결돼 있어 유형을 바꾸지 못하게 막는다 */
export function isDefaultQuestion(id: string): boolean {
  return DEFAULT_CITIZEN_QUESTION_IDS.includes(id)
}

/** 새 질문의 답변 키. 시각 기반이라 한 화면에서 겹치지 않는다 */
function newQuestionId(): string {
  return `q${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

export function createQuestionDraft(): QuestionDraft {
  return {
    id: newQuestionId(),
    type: 'text',
    label: '',
    required: false,
    optionsText: '',
    notice: '',
  }
}

export function toQuestionDrafts(questions: CitizenFormQuestion[]): QuestionDraft[] {
  return questions.map((question) => ({
    id: question.id,
    type: question.type,
    label: question.label,
    required: question.required,
    optionsText: (question.options ?? []).join('\n'),
    notice: question.notice ?? '',
    maxLength: question.maxLength,
    showWhen: question.showWhen,
  }))
}

/**
 * 저장 형태로 되돌린다.
 * 문구가 비어 있는 질문은 화면에 그릴 수 없으므로 저장하지 않는다.
 */
export function fromQuestionDrafts(drafts: QuestionDraft[]): CitizenFormQuestion[] {
  return drafts
    .filter((draft) => draft.label.trim())
    .map((draft) => {
      const question: CitizenFormQuestion = {
        id: draft.id,
        type: draft.type,
        label: draft.label.trim(),
        required: draft.required,
      }
      if (draft.type === 'select' || draft.type === 'checkbox') {
        question.options = draft.optionsText
          .split('\n')
          .map((option) => option.trim())
          .filter(Boolean)
      }
      if (draft.notice.trim()) question.notice = draft.notice.trim()
      if (draft.maxLength) question.maxLength = draft.maxLength
      if (draft.showWhen) question.showWhen = draft.showWhen
      return question
    })
}

/**
 * 조건(꼬리 질문) 값을 선택 상자 한 칸으로 주고받기 위한 인코딩.
 * '항상 보여주기'는 'always', 조건이 있으면 '질문id:yes' 형태로 쓴다.
 *
 * 빈 문자열을 쓰지 않는 이유: 선택 상자(Radix Select)는 빈 문자열을
 * '고르지 않음'을 뜻하는 값으로 쓰기 때문에, 항목 값으로 주면 오류를 내고
 * 작품 수정 화면 전체가 열리지 않는다.
 */
export const ALWAYS_VISIBLE = 'always'

export function encodeShowWhen(showWhen?: { questionId: string; equals: string }): string {
  return showWhen ? `${showWhen.questionId}:${showWhen.equals}` : ALWAYS_VISIBLE
}

export function decodeShowWhen(value: string): { questionId: string; equals: string } | undefined {
  // 질문 id에는 ':'가 들어가지 않으므로 마지막 구분자 하나만 잘라내면 된다
  const separator = value.lastIndexOf(':')
  if (separator <= 0) return undefined
  const questionId = value.slice(0, separator)
  const equals = value.slice(separator + 1)
  if (!questionId || (equals !== 'yes' && equals !== 'no')) return undefined
  return { questionId, equals }
}

/**
 * 조건으로 삼을 수 있는 앞선 질문 목록.
 *
 * 조건은 예/아니오 답을 기준으로 하고, 자기보다 앞에 있는 질문만 고를 수 있다.
 * 뒤에 있는 질문을 조건으로 걸면 답을 묻기도 전에 꼬리 질문이 나오는 꼴이 된다.
 */
export function showWhenCandidates(drafts: QuestionDraft[], index: number): QuestionDraft[] {
  return drafts.filter(
    (draft, position) => position < index && draft.type === 'yesno' && draft.label.trim()
  )
}

/**
 * 더 이상 성립하지 않는 조건을 걷어낸다.
 *
 * 조건으로 삼던 질문을 지우거나, 유형을 예/아니오가 아닌 것으로 바꾸거나,
 * 꼬리 질문보다 뒤로 옮기면 조건을 판정할 수 없다.
 * 그대로 저장하면 신청서에서 그 질문이 영영 나오지 않으므로 '항상 보여주기'로 되돌린다.
 */
export function pruneShowWhen(drafts: QuestionDraft[]): QuestionDraft[] {
  return drafts.map((draft, index) => {
    if (!draft.showWhen) return draft
    const isValid = showWhenCandidates(drafts, index).some(
      (candidate) => candidate.id === draft.showWhen?.questionId
    )
    if (isValid) return draft
    const { showWhen: _removed, ...rest } = draft
    return rest
  })
}
