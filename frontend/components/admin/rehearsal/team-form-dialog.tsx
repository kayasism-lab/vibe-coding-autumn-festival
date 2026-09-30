'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MOBILE_SHEET, SheetBody, SheetFooter, SheetHeader } from '@/components/admin/mobile-sheet'
import { REHEARSAL_LABELS, type RehearsalKind } from '@/lib/rehearsal'
import { cn } from '@/lib/utils'

export interface TeamForm {
  /** 단막극 팀인지 낭독극 팀인지. 만든 뒤에는 바꾸지 않는다 */
  kind: RehearsalKind
  title: string
  name: string
  /** 단막극은 연출, 낭독극은 메인강사 */
  director: string
  assistantDirector: string
  /** 낭독극에서 메인강사와 함께하는 강사 이름을 쉼표나 줄바꿈으로 적은 글 */
  instructorsText: string
  /** 팀원 이름을 한 줄에 한 명씩 적은 글. 저장할 때 목록으로 나눈다 */
  membersText: string
  order: number
}

export const emptyTeamForm: TeamForm = {
  kind: 'short_play',
  title: '',
  name: '',
  director: '',
  assistantDirector: '',
  instructorsText: '',
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
  /** 종류(단막극·낭독극)를 고를 수 있는지. 관리자가 새 팀을 만들 때만 true다 */
  canChooseKind: boolean
  form: TeamForm
  setForm: (form: TeamForm) => void
  errorMessage: string
  isSaving: boolean
  onSave: () => void
}

export function TeamFormDialog({
  isOpen,
  onOpenChange,
  isEditing,
  canChooseKind,
  form,
  setForm,
  errorMessage,
  isSaving,
  onSave,
}: Props) {
  const memberCount = parseMembers(form.membersText).length
  const isReading = form.kind === 'reading'
  const labels = REHEARSAL_LABELS[form.kind]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* 휴대폰에서는 전체 화면으로 열고 저장 버튼을 아래에 붙여 둔다 (mobile-sheet.tsx) */}
      <DialogContent className={cn(MOBILE_SHEET, 'sm:max-h-[90dvh] sm:max-w-lg')}>
        <SheetHeader>
          <DialogTitle>{isEditing ? '팀 정보 수정' : '팀 추가'} · {labels.program}</DialogTitle>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {canChooseKind && (
            <Field label="종류" required>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(REHEARSAL_LABELS) as RehearsalKind[]).map((kind) => (
                  <Button
                    key={kind}
                    type="button"
                    className="h-11 sm:h-9"
                    variant={form.kind === kind ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, kind })}
                  >
                    {REHEARSAL_LABELS[kind].program}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">만든 뒤에는 종류를 바꿀 수 없습니다.</p>
            </Field>
          )}
          {/* 낭독극은 작품명·팀명이 따로 없어 묻지 않는다. 서버가 '열린 낭독극'으로 채운다 */}
          {!isReading && (
            <>
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
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.leader} required>
              <Input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} />
            </Field>
            {/* 낭독극은 조연출이 없고, 메인강사와 함께하는 강사를 적는다 */}
            {isReading ? (
              <Field label="함께하는 강사">
                <Input
                  placeholder="쉼표로 나눠 적어주세요 (예: 김철수, 이영희)"
                  value={form.instructorsText}
                  onChange={(e) => setForm({ ...form, instructorsText: e.target.value })}
                />
              </Field>
            ) : (
              <Field label="조연출">
                <Input
                  placeholder="없으면 비워두세요"
                  value={form.assistantDirector}
                  onChange={(e) => setForm({ ...form, assistantDirector: e.target.value })}
                />
              </Field>
            )}
          </div>
          <Field label={`${labels.member} (${memberCount}명)`}>
            <Textarea
              rows={6}
              placeholder={'한 줄에 한 명씩 적어주세요\n홍길동\n김철수'}
              value={form.membersText}
              onChange={(e) => setForm({ ...form, membersText: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              연습일지의 출석 체크 명단이 됩니다. 명단을 바꿔도 이미 쓴 일지의 출석 기록은 그대로 남습니다.
            </p>
          </Field>
          <Field label="표시 순서">
            <Input
              type="number"
              inputMode="numeric"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">작은 숫자가 위에 나옵니다.</p>
          </Field>
        </SheetBody>

        {/* 오류 문구는 저장 버튼 바로 위에 보여준다 (폼을 끝까지 내리지 않아도 보이게) */}
        <SheetFooter error={errorMessage}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</Button>
        </SheetFooter>
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
