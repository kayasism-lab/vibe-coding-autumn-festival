'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Field, RadioOption } from '@/components/citizen-application-fields'
import {
  visibleCitizenQuestions,
  type CitizenAnswerValue,
  type CitizenAnswers,
  type CitizenFormQuestion,
} from '@/lib/citizen-application-questions'

/** 필수 항목에는 문구 끝에 *를 붙인다 (고정 항목 표기와 같은 방식) */
function questionLabel(question: CitizenFormQuestion): string {
  return question.required ? `${question.label} *` : question.label
}

/**
 * 질문 하나를 유형에 맞는 입력칸으로 그린다.
 *
 * 질문 구성이 담당자에 따라 달라지므로, 화면에서는 required 속성으로 브라우저 검증까지
 * 걸지 않고 제출 직전에 한 번에 확인한다. 조건부로 나타났다 사라지는 항목에
 * required를 걸면 숨은 칸 때문에 제출이 막히는 일이 생긴다.
 */
function QuestionField({
  question,
  value,
  onChange,
  /** 한 화면에 신청 폼과 수정 폼이 같이 있을 수 있어 입력 id를 구분한다 */
  idPrefix,
}: {
  question: CitizenFormQuestion
  value: CitizenAnswerValue | undefined
  onChange: (value: CitizenAnswerValue) => void
  idPrefix: string
}) {
  const fieldId = `${idPrefix}-${question.id}`

  if (question.type === 'yesno') {
    const current = value === true ? 'yes' : value === false ? 'no' : ''
    return (
      <Field label={questionLabel(question)} hint={question.notice}>
        <RadioGroup value={current} onValueChange={(v) => onChange(v === 'yes')} className="flex gap-6">
          <RadioOption value="yes" id={`${fieldId}-yes`} label="예" />
          <RadioOption value="no" id={`${fieldId}-no`} label="아니오" />
        </RadioGroup>
      </Field>
    )
  }

  if (question.type === 'select') {
    return (
      <Field label={questionLabel(question)} hint={question.notice}>
        <RadioGroup
          value={typeof value === 'string' ? value : ''}
          onValueChange={onChange}
          className="flex flex-col gap-2"
        >
          {(question.options ?? []).map((option, index) => (
            <RadioOption key={option} value={option} id={`${fieldId}-${index}`} label={option} />
          ))}
        </RadioGroup>
      </Field>
    )
  }

  if (question.type === 'checkbox') {
    const picked = Array.isArray(value) ? value : []
    const options = question.options ?? []
    const toggle = (option: string, checked: boolean) => {
      // 담당자가 등록한 선택지 순서를 지켜야 관리자가 볼 때도 같은 순서로 보인다
      onChange(
        checked ? options.filter((it) => it === option || picked.includes(it)) : picked.filter((it) => it !== option)
      )
    }

    return (
      <Field label={questionLabel(question)} hint={question.notice}>
        <div className="space-y-2 rounded-md border p-3">
          {options.map((option, index) => {
            const optionId = `${fieldId}-${index}`
            return (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={optionId}
                  className="mt-0.5"
                  checked={picked.includes(option)}
                  onCheckedChange={(checked) => toggle(option, checked === true)}
                />
                <Label htmlFor={optionId} className="cursor-pointer font-normal leading-relaxed">
                  {option}
                </Label>
              </div>
            )
          })}
        </div>
      </Field>
    )
  }

  if (question.type === 'textarea') {
    return (
      <Field label={questionLabel(question)} hint={question.notice}>
        <Textarea
          rows={4}
          maxLength={question.maxLength}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    )
  }

  return (
    <Field label={questionLabel(question)} hint={question.notice}>
      <Input
        maxLength={question.maxLength}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

/**
 * 담당자가 만든 질문 목록을 순서대로 그린다.
 *
 * 신청 폼과 신청 내역 수정 화면이 같은 질문을 똑같이 보여줘야 해서 한 컴포넌트로 묶었다.
 * 앞 질문의 답에 따라 나타나는 꼬리 질문이 있어, 지금 답변 상태로 보일 항목을 매번 다시 고른다.
 */
export function CitizenQuestionFields({
  questions,
  answers,
  onChange,
  idPrefix = 'q',
}: {
  questions: CitizenFormQuestion[]
  answers: CitizenAnswers
  onChange: (answers: CitizenAnswers) => void
  idPrefix?: string
}) {
  return (
    <>
      {visibleCitizenQuestions(questions, answers).map((question) => (
        <QuestionField
          key={question.id}
          question={question}
          value={answers[question.id]}
          idPrefix={idPrefix}
          onChange={(value) => onChange({ ...answers, [question.id]: value })}
        />
      ))}
    </>
  )
}
