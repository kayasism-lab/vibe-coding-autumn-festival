'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import {
  citizenQuestionTypeOptions,
  type CitizenQuestionType,
} from '@/lib/citizen-application-questions'
import {
  createQuestionDraft,
  isDefaultQuestion,
  type QuestionDraft,
} from '@/lib/citizen-question-draft'

/** 목록에서 두 항목의 자리를 바꾼다 (질문 순서 이동) */
function move(drafts: QuestionDraft[], index: number, step: number): QuestionDraft[] {
  const target = index + step
  if (target < 0 || target >= drafts.length) return drafts
  const next = [...drafts]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function QuestionCard({
  draft,
  index,
  total,
  drafts,
  onChange,
  onMove,
  onRemove,
}: {
  draft: QuestionDraft
  index: number
  total: number
  /** 꼬리 질문 안내에 쓸 전체 목록 (조건이 가리키는 질문의 문구를 찾는다) */
  drafts: QuestionDraft[]
  onChange: (draft: QuestionDraft) => void
  onMove: (step: number) => void
  onRemove: () => void
}) {
  const needsOptions = draft.type === 'select' || draft.type === 'checkbox'
  // 기본 질문은 기존 신청서 필드와 연결돼 있어 유형을 바꾸면 예전 답을 읽을 수 없게 된다
  const isDefault = isDefaultQuestion(draft.id)
  const parent = draft.showWhen
    ? drafts.find((item) => item.id === draft.showWhen?.questionId)
    : undefined

  return (
    <div className="space-y-3 rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{index + 1}번 질문</span>
          {isDefault && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">기본 항목</span>
          )}
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => onMove(-1)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={() => onMove(1)}>
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

      {parent && (
        <p className="text-xs text-muted-foreground">
          &lsquo;{parent.label || '앞 질문'}&rsquo;에 &lsquo;
          {draft.showWhen?.equals === 'yes' ? '예' : '아니오'}&rsquo;라고 답한 분에게만 보입니다.
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

/**
 * 신청서 질문을 담당자가 직접 만들고 고치는 영역.
 *
 * 질문 문구와 항목 구성은 해마다 바뀌는데 코드에 박아두면 담당자가 손댈 수 없어,
 * 여기서 만든 값을 작품 정보에 저장하고 신청서가 그대로 그린다.
 */
export function ProgramQuestionBuilder({
  drafts,
  onChange,
}: {
  drafts: QuestionDraft[]
  onChange: (drafts: QuestionDraft[]) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>신청서 질문</Label>
          <p className="text-xs text-muted-foreground">
            신청자에게 물어볼 항목입니다. 이름·연락처·이메일·사는곳·나이·성별은 항상 받으므로 여기에 없습니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onChange([...drafts, createQuestionDraft()])}
        >
          <Plus className="mr-1 h-4 w-4" />
          질문 추가
        </Button>
      </div>

      {drafts.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          질문이 없습니다. &lsquo;질문 추가&rsquo;로 만들어주세요.
        </p>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, index) => (
            <QuestionCard
              key={draft.id}
              draft={draft}
              index={index}
              total={drafts.length}
              drafts={drafts}
              onChange={(next) => onChange(drafts.map((item, i) => (i === index ? next : item)))}
              onMove={(step) => onChange(move(drafts, index, step))}
              onRemove={() => onChange(drafts.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
