'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  /** 입력 칸 아래에 덧붙일 안내 문구 (비밀번호 규칙 등) */
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function RadioOption({ value, id, label }: { value: string; id: string; label: string }) {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="font-normal cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

/**
 * 참여할 수 없는 일정을 고르는 항목.
 *
 * 일정 목록은 담당자가 작품 관리 화면에서 입력한 값이라 개수가 정해져 있지 않고,
 * 전부 참여 가능하면 아무것도 고르지 않는 것이 정상이므로 필수 입력으로 두지 않는다.
 */
export function ScheduleCheckField({
  label,
  notice,
  items,
  value,
  onChange,
}: {
  label: string
  /** 목록 아래에 붙는 안내 문구 */
  notice: string
  items: string[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  const toggle = (item: string, checked: boolean) => {
    // 원래 목록 순서를 유지해야 관리자가 볼 때도 일정 순서대로 보인다
    onChange(checked ? items.filter((it) => it === item || value.includes(it)) : value.filter((it) => it !== item))
  }

  return (
    <Field label={label}>
      <div className="space-y-2 rounded-md border p-3">
        {items.map((item, index) => {
          const id = `schedule-${index}`
          return (
            <div key={item} className="flex items-start space-x-2">
              <Checkbox
                id={id}
                className="mt-0.5"
                checked={value.includes(item)}
                onCheckedChange={(checked) => toggle(item, checked === true)}
              />
              <Label htmlFor={id} className="cursor-pointer font-normal leading-relaxed">
                {item}
              </Label>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">{notice}</p>
    </Field>
  )
}

export function YesNoField({
  label,
  value,
  onChange,
  name,
}: {
  label: string
  value: boolean | ''
  onChange: (value: boolean) => void
  name: string
}) {
  return (
    <Field label={label}>
      <RadioGroup value={value === '' ? '' : value ? 'yes' : 'no'} onValueChange={(v) => onChange(v === 'yes')} className="flex gap-6">
        <RadioOption value="yes" id={`${name}-yes`} label="예" />
        <RadioOption value="no" id={`${name}-no`} label="아니오" />
      </RadioGroup>
    </Field>
  )
}
