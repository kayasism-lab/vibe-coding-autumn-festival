'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, Lock } from 'lucide-react'
import { GRANTABLE_PERMISSION_META, GROUP_PERMISSION_META, type GroupPermission } from '@/lib/admin-permissions'

export type UserRole = 'superadmin' | 'admin' | 'group' | 'normal'

export interface UserForm {
  name: string
  email: string
  phone: string
  theaterGroup: string
  permissions: GroupPermission[]
  role: UserRole
  password: string
}

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  form: UserForm
  setForm: (form: UserForm) => void
  theaterGroups: { _id: string; name: string }[]
  errorMessage: string
  onSave: () => void
}

export function UserFormDialog({
  isOpen,
  onOpenChange,
  isEditing,
  form,
  setForm,
  theaterGroups,
  errorMessage,
  onSave,
}: Props) {
  const isGroupAccount = form.role === 'group'

  const togglePermission = (key: GroupPermission) => {
    const next = form.permissions.includes(key)
      ? form.permissions.filter((permission) => permission !== key)
      : [...form.permissions, key]
    setForm({ ...form, permissions: next })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? '사용자 수정' : '사용자 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="이름">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="이메일">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="연락처">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>

          <Field label="계정 유형">
            <Select value={form.role} onValueChange={(role: UserRole) => setForm({ ...form, role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">슈퍼관리자</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="group">극단 담당자</SelectItem>
                <SelectItem value="normal">일반회원</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {isGroupAccount && (
            <>
              <Field label="담당 극단">
                <Select
                  value={form.theaterGroup}
                  onValueChange={(theaterGroup) => setForm({ ...form, theaterGroup })}
                >
                  <SelectTrigger><SelectValue placeholder="극단을 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    {theaterGroups.map((group) => (
                      <SelectItem key={group._id} value={group._id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  선택한 극단의 정보와 작품만 수정할 수 있습니다. 극단명이 바뀌어도 연결은 유지됩니다.
                </p>
              </Field>

              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">관리 권한</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    기본 권한은 항상 부여되며, 아래 추가 권한만 켜고 끌 수 있습니다.
                  </p>
                </div>

                <ul className="space-y-2">
                  {GROUP_PERMISSION_META.filter((meta) => !meta.grantable).map((meta) => (
                    <li key={meta.key} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        <span className="font-medium text-foreground">{meta.label}</span>
                        <span className="ml-1.5 text-xs">기본 제공</span>
                        <span className="block text-xs">{meta.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 border-t border-border pt-3">
                  {GRANTABLE_PERMISSION_META.map((meta) => {
                    const checked = form.permissions.includes(meta.key)
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        onClick={() => togglePermission(meta.key)}
                        className={`flex w-full items-start gap-2 rounded-md border p-2.5 text-left transition-colors ${
                          checked
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-transparent hover:bg-background'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                            checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="text-sm">
                          <span className="font-medium text-foreground">{meta.label}</span>
                          <span className="block text-xs text-muted-foreground">{meta.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <Field label={isEditing ? '새 비밀번호 (변경할 때만 입력)' : '비밀번호'}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
