'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { ProgramQuestionCard } from '@/components/admin/program-question-card'
import { createQuestionDraft, pruneShowWhen, type QuestionDraft } from '@/lib/citizen-question-draft'

/**
 * 질문을 원하는 자리로 옮긴다.
 *
 * 두 질문의 자리를 맞바꾸지 않고 뽑아서 끼워 넣는다.
 * 5번을 2번으로 보낼 때 2번과 통째로 뒤바뀌면 담당자가 의도한 순서가 아니다.
 * 사이에 있던 질문들이 한 칸씩 밀려나야 목록을 다시 읽었을 때 자연스럽다.
 */
function moveTo(drafts: QuestionDraft[], from: number, to: number): QuestionDraft[] {
  if (to < 0 || to >= drafts.length || from === to) return drafts
  const next = [...drafts]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
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
  /**
   * 질문을 지울 때는 조건도 함께 정리한다.
   * 조건으로 삼던 질문이 사라지면 꼬리 질문이 신청서에 영영 나오지 않기 때문이다.
   * 순서·유형 변경은 담당자가 되돌릴 수 있어 지우지 않고 카드에 경고만 띄운다.
   */
  const removeAt = (index: number) => {
    onChange(pruneShowWhen(drafts.filter((_, i) => i !== index)))
  }

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
            <ProgramQuestionCard
              key={draft.id}
              draft={draft}
              index={index}
              total={drafts.length}
              drafts={drafts}
              onChange={(next) => onChange(drafts.map((item, i) => (i === index ? next : item)))}
              onMoveTo={(target) => onChange(moveTo(drafts, index, target))}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
