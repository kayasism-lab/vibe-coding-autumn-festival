'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  roster: string[]
  attendees: string[]
  onChange: (attendees: string[]) => void
}

/**
 * 출석 체크. 이름을 누르면 출석/결석이 바뀐다.
 * 연습실에서 휴대폰으로 빠르게 누를 수 있게 칸을 큼직하게 둔다
 */
export function AttendanceCheck({ roster, attendees, onChange }: Props) {
  if (roster.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        등록된 팀원이 없습니다. 연습일지 설정에서 팀원을 먼저 등록해주세요.
      </p>
    )
  }

  const allChecked = roster.every((name) => attendees.includes(name))

  const toggle = (name: string) => {
    const next = attendees.includes(name) ? attendees.filter((item) => item !== name) : [...attendees, name]
    // 저장 순서를 명단 순서에 맞춰 두면 일지·PDF에서 이름 순서가 흔들리지 않는다
    onChange(roster.filter((item) => next.includes(item)))
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          출석 <b className="text-foreground">{attendees.length}</b> / {roster.length}명
        </span>
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => onChange(allChecked ? [] : [...roster])}
        >
          {allChecked ? '모두 해제' : '모두 출석'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {roster.map((name) => {
          const checked = attendees.includes(name)
          return (
            <button
              key={name}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(name)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                checked ? 'border-primary bg-primary/10 font-medium text-foreground' : 'bg-background text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border',
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                )}
              >
                {checked && <Check className="h-3.5 w-3.5" />}
              </span>
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
