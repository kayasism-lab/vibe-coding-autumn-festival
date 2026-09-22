'use client'

import { Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import {
  citizenQuestionTypeOptions,
  type CitizenQuestionType,
} from '@/lib/citizen-application-questions'
import {
  ALWAYS_VISIBLE,
  decodeShowWhen,
  encodeShowWhen,
  isDefaultQuestion,
  showWhenCandidates,
  type QuestionDraft,
} from '@/lib/citizen-question-draft'

/** 조건 선택 상자에 넣을 항목 문구. 질문이 길면 목록이 읽기 어려워 줄여서 보여준다 */
function shortLabel(label: string): string {
  const text = label.trim() || '이름 없는 질문'
  return text.length > 24 ? `${text.slice(0, 24)}…` : text
}

/**
 * 질문 한 건을 편집하는 카드.
 *
 * '조건부 표시'는 앞선 예/아니오 질문의 답에 따라 이 질문을 보여줄지 정하는 설정이다.
 * 소속 여부를 먼저 묻고 '예'라고 답한 분에게만 소속 극단을 고르게 하는 식으로 쓴다.
 */
export function ProgramQuestionCard({
  draft,
  index,
  total,
  drafts,
  onChange,
  onMoveTo,
  onRemove,
}: {
  draft: QuestionDraft
  index: number
  total: number
  /** 조건으로 고를 수 있는 앞선 질문을 찾기 위한 전체 목록 */
  drafts: QuestionDraft[]
  onChange: (draft: QuestionDraft) => void
  /** 이 질문을 몇 번째 자리로 옮길지 (0부터 센다) */
  onMoveTo: (index: number) => void
  onRemove: () => void
}) {
  const needsOptions = draft.type === 'select' || draft.type === 'checkbox'
  // 기본 질문은 기존 신청서 필드와 연결돼 있어 유형을 바꾸면 예전 답을 읽을 수 없게 된다
  const isDefault = isDefaultQuestion(draft.id)

  const candidates = showWhenCandidates(drafts, index)
  // 조건은 걸려 있는데 고를 수 있는 목록에 없는 경우 = 조건이 깨진 상태.
  // 질문 순서를 바꿨거나 조건이 되던 질문의 유형을 예/아니오에서 바꾼 뒤에 생긴다
  const isBrokenCondition =
    !!draft.showWhen && !candidates.some((item) => item.id === draft.showWhen?.questionId)
  const brokenParent = isBrokenCondition
    ? drafts.find((item) => item.id === draft.showWhen?.questionId)
    : undefined

  return (
    <div className="space-y-3 rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 번호를 직접 골라 그 자리로 보낸다. 질문이 많을 때 화살표만으로는 여러 번 눌러야 한다 */}
          <Select
            value={String(index + 1)}
            disabled={total < 2}
            onValueChange={(value) => onMoveTo(Number(value) - 1)}
          >
            <SelectTrigger className="h-7 w-[5.25rem] text-xs" aria-label="질문 순서">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: total }, (_, position) => (
                <SelectItem key={position} value={String(position + 1)}>
                  {position + 1}번째
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDefault && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">기본 항목</span>
          )}
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="한 칸 위로" disabled={index === 0} onClick={() => onMoveTo(index - 1)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="한 칸 아래로" disabled={index === total - 1} onClick={() => onMoveTo(index + 1)}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Input
        value={draft.label}
        placeholder="신청서에 보일 질문 문구"
        onChange={(e) => onChange({ ...draft, label: e.target.value })}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[9rem] flex-1">
          <Select
            value={draft.type}
            disabled={isDefault}
            onValueChange={(type) => onChange({ ...draft, type: type as CitizenQuestionType })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {citizenQuestionTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`required-${draft.id}`}
            checked={draft.required}
            onCheckedChange={(checked) => onChange({ ...draft, required: checked === true })}
          />
          <Label htmlFor={`required-${draft.id}`} className="cursor-pointer text-sm font-normal">
            필수 입력
          </Label>
        </div>
      </div>

      {isDefault && (
        <p className="text-xs text-muted-foreground">
          이미 접수된 신청서와 연결된 항목이라 입력 방식은 바꿀 수 없습니다. 문구·순서·필수 여부는 바꿀 수 있습니다.
        </p>
      )}

      {/* 조건부 표시: 앞선 예/아니오 질문의 답에 따라 이 질문을 보여줄지 정한다 */}
      <div className="space-y-1">
        <Label className="text-xs font-normal text-muted-foreground">조건부 표시</Label>
        {candidates.length === 0 && !draft.showWhen ? (
          <p className="text-xs text-muted-foreground">
            앞쪽에 &lsquo;예 / 아니오&rsquo; 질문이 있어야 조건을 걸 수 있습니다.
          </p>
        ) : (
          <Select
            value={encodeShowWhen(draft.showWhen)}
            onValueChange={(value) => {
              const showWhen = value === ALWAYS_VISIBLE ? undefined : decodeShowWhen(value)
              // showWhen 키를 남겨두면 '조건 없음'과 구분되지 않아 통째로 지운다
              const { showWhen: _removed, ...rest } = draft
              onChange(showWhen ? { ...rest, showWhen } : rest)
            }}
          >
            <SelectTrigger className="h-9">
              {/* 조건이 깨진 질문은 고를 수 있는 항목에 지금 값이 없어 빈칸으로 보인다.
                  무엇을 해야 하는지 대신 알려준다 */}
              <SelectValue placeholder="조건을 다시 골라주세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALWAYS_VISIBLE}>항상 보여주기</SelectItem>
              {candidates.map((candidate) => (
                <Fragment key={candidate.id}>
                  <SelectItem value={`${candidate.id}:yes`}>
                    {shortLabel(candidate.label)} → &lsquo;예&rsquo;일 때만
                  </SelectItem>
                  <SelectItem value={`${candidate.id}:no`}>
                    {shortLabel(candidate.label)} → &lsquo;아니오&rsquo;일 때만
                  </SelectItem>
                </Fragment>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isBrokenCondition && (
        <p className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          조건으로 삼은 &lsquo;{brokenParent?.label || '앞 질문'}&rsquo;이 이 질문보다 뒤에 있거나 예/아니오 질문이
          아닙니다. 이대로 저장하면 이 질문이 신청서에 나오지 않으니 조건이나 순서를 다시 정해주세요.
        </p>
      )}

      {needsOptions && (
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">선택지 (한 줄에 하나씩)</Label>
          <Textarea
            rows={4}
            value={draft.optionsText}
            placeholder={'9/29(화) 20:00-22:00\n10/6(화) 20:00-22:00'}
            onChange={(e) => onChange({ ...draft, optionsText: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            선택지를 비워두면 이 질문은 신청서에 나오지 않습니다.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-normal text-muted-foreground">안내 문구 (선택)</Label>
        <Textarea
          rows={2}
          value={draft.notice}
          placeholder="입력칸 아래에 작게 붙는 설명입니다."
          onChange={(e) => onChange({ ...draft, notice: e.target.value })}
        />
      </div>
    </div>
  )
}
