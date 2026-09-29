'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface TeamForm {
  title: string
  name: string
  director: string
  assistantDirector: string
  /** 팀원 이름을 한 줄에 한 명씩 적은 글. 저장할 때 목록으로 나눈다 */
  membersText: string
  order: number
}

export const emptyTeamForm: TeamForm = {
  title: '',
  name: '',
  director: '',
  assistantDirector: '',
  membersText: '',
  order: 0,
}

/** 줄바꿈·쉼표로 나눠 이름 목록으로 만든다. 붙여넣기한 명단도 그대로 받기 위해 쉼표도 허용한다 */
export function parseMembers(text: string) {
  const names = text
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter(Boolean)
  return [...new Set(names)]
}

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  form: TeamForm
  setForm: (form: TeamForm) => void
  errorMessage: string
  isSaving: boolean
  onSave: () => void
}

export function TeamFormDialog({ isOpen, onOpenChange, isEditing, form, setForm, errorMessage, isSaving, onSave }: Props) {
  const memberCount = parseMembers(form.membersText).length

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? '팀 정보 수정' : '팀 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="작품명" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="팀명" required>
            <Input
              placeholder="연습일지에서 팀을 고를 때 보이는 이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="연출" required>
              <Input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} />
            </Field>
            <Field label="조연출">
              <Input
                placeholder="없으면 비워두세요"
                value={form.assistantDirector}
                onChange={(e) => setForm({ ...form, assistantDirector: e.target.value })}
              />
            </Field>
          </div>
          <Field label={`팀원 (${memberCount}명)`}>
            <Textarea
              rows={6}
              placeholder={'한 줄에 한 명씩 적어주세요\n홍길동\n김철수'}
              value={form.membersText}
              onChange={(e) => setForm({ ...form, membersText: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              연습일지의 출석 체크 명단이 됩니다. 팀원을 바꿔도 이미 쓴 일지의 출석 기록은 그대로 남습니다.
            </p>
          </Field>
          <Field label="표시 순서">
            <Input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">작은 숫자가 위에 나옵니다.</p>
          </Field>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}
