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
      // 꼬리 질문 조건은 화면에서 만들지 않고, 기본 질문에 붙어 있던 값을 그대로 지킨다
      if (draft.showWhen) question.showWhen = draft.showWhen
      return question
    })
}
