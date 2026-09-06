'use client'

import {
  resolveAnsweredQuestions,
  toCitizenAnswers,
  type AnsweredQuestion,
  type CitizenAnswers,
  type LegacyCitizenAnswerSource,
} from '@/lib/citizen-application-questions'

/** 관리자 화면에서 답을 읽는 데 필요한 만큼만 추린 신청서 값 */
export interface AnswerSource extends LegacyCitizenAnswerSource {
  answeredQuestions?: AnsweredQuestion[] | null
}

const yesNo = (value: boolean) => (value ? '예' : '아니오')

/** 답을 화면에 쓸 문자열로 바꾼다 (목록형은 별도로 그리므로 여기서는 다루지 않는다) */
function formatAnswer(value: CitizenAnswers[string] | undefined): string {
  if (typeof value === 'boolean') return yesNo(value)
  if (Array.isArray(value)) return value.join(', ')
  return value ?? ''
}

/** 한 줄로 끝나는 답인지. 짧은 답은 위쪽 요약 그리드에 모아 보여준다 */
function isShortAnswer(question: AnsweredQuestion): boolean {
  return question.type === 'yesno' || question.type === 'select' || question.type === 'text'
}

/**
 * 신청자가 답한 질문과 답을 보여준다.
 *
 * 질문 구성이 작품마다 다르므로 항목을 코드에 박지 않고, 신청서에 저장된
 * 질문 스냅샷을 그대로 따라 그린다. 스냅샷이 없는 예전 신청서는
 * 기본 질문 중 값이 있는 것만 골라 지금까지와 같은 모습으로 보여준다.
 */
export function CitizenApplicationAnswers({ application }: { application: AnswerSource }) {
  const questions = resolveAnsweredQuestions(application)
  const answers = toCitizenAnswers([], application)

  const shortQuestions = questions.filter(isShortAnswer)
  const longQuestions = questions.filter((question) => !isShortAnswer(question))

  return (
    <>
      {shortQuestions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {shortQuestions.map((question) => (
            <div key={question.id}>
              <p className="text-muted-foreground">{question.label}</p>
              <p className="font-medium">{formatAnswer(answers[question.id])}</p>
            </div>
          ))}
        </div>
      )}

      {longQuestions.map((question) => {
        const value = answers[question.id]
        // 고른 항목이 없거나 답을 비워둔 선택 항목은 자리를 차지하지 않게 건너뛴다
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          return null
        }

        return (
          <div key={question.id}>
            <p className="mb-2 text-sm text-muted-foreground">{question.label}</p>
            {Array.isArray(value) ? (
              <ul className="space-y-1 rounded-md border p-3 text-sm">
                {value.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            ) : (
              <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm">{formatAnswer(value)}</p>
            )}
          </div>
        )
      })}
    </>
  )
}
