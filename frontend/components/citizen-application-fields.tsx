'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
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
