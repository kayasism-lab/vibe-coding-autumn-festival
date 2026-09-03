'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, Lock } from 'lucide-react'
import {
  GRANTABLE_PERMISSION_META,
  GROUP_DEFAULT_PERMISSIONS,
  GROUP_PERMISSION_META,
  PROGRAM_TYPE_DEFAULT_PERMISSIONS,
  type GroupPermission,
} from '@/lib/admin-permissions'
import { PROGRAM_TYPE_ACCOUNT_OPTIONS, type ProgramTypeAccount } from '@/lib/program-type-account'

export type UserRole = 'superadmin' | 'admin' | 'group' | 'normal'

export interface UserForm {
  name: string
  email: string
  phone: string
  theaterGroup: string
  // 담당 극단이 없는 계정(낭독극·단막극 담당자)만 값이 있다. theaterGroup과 동시에 값을 갖지 않는다
  programType: ProgramTypeAccount | ''
  permissions: GroupPermission[]
  role: UserRole
  password: string
}

// "담당 대상" 선택창에 극단·공연 유형을 한 목록에 섞어 보여주기 위한 값 인코딩.
// Select 컴포넌트는 값 하나만 다루므로, 실제 저장 필드(theaterGroup/programType)로 분해해 쓴다
const GROUP_VALUE_PREFIX = 'group:'
const TYPE_VALUE_PREFIX = 'type:'

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
  // 담당 극단 없이 공연 유형만 담당하는 계정(낭독극·단막극 담당자)인지
  const isProgramTypeAccount = isGroupAccount && !!form.programType

  const togglePermission = (key: GroupPermission) => {
    const next = form.permissions.includes(key)
      ? form.permissions.filter((permission) => permission !== key)
      : [...form.permissions, key]
    setForm({ ...form, permissions: next })
  }

  // "담당 극단" 선택값과 "담당 공연 유형" 선택값을 하나의 드롭다운으로 합쳐서 다룬다
  const ownerValue = form.theaterGroup
    ? `${GROUP_VALUE_PREFIX}${form.theaterGroup}`
    : form.programType
      ? `${TYPE_VALUE_PREFIX}${form.programType}`
      : ''

  const handleOwnerChange = (value: string) => {
    if (value.startsWith(GROUP_VALUE_PREFIX)) {
      setForm({ ...form, theaterGroup: value.slice(GROUP_VALUE_PREFIX.length), programType: '' })
      return
    }
    if (value.startsWith(TYPE_VALUE_PREFIX)) {
      const type = value.slice(TYPE_VALUE_PREFIX.length) as ProgramTypeAccount
      setForm({ ...form, theaterGroup: '', programType: type })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? '사용자 수정' : '사용자 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="이름" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          {/* 이메일 주소가 아니라 로그인용 아이디로만 쓰이므로 형식 제한을 두지 않는다 */}
          <Field label="아이디" required>
            <Input
              type="text"
              autoComplete="off"
              placeholder="로그인에 사용할 아이디"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
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
              <Field label="담당 대상">
                <Select value={ownerValue} onValueChange={handleOwnerChange}>
                  <SelectTrigger><SelectValue placeholder="극단 또는 공연 유형을 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>극단</SelectLabel>
                      {theaterGroups.map((group) => (
                        <SelectItem key={group._id} value={`${GROUP_VALUE_PREFIX}${group._id}`}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      {/* 소유 극단이 없는(협의회 직접 주관) 공연 유형만 담당하는 계정 */}
                      <SelectLabel>공연 유형</SelectLabel>
                      {PROGRAM_TYPE_ACCOUNT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={`${TYPE_VALUE_PREFIX}${option.value}`}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isProgramTypeAccount
                    ? '선택한 공연 유형 중 소유 극단이 없는(협의회 직접 주관) 작품만 수정할 수 있습니다.'
                    : '선택한 극단의 정보와 작품만 수정할 수 있습니다. 극단명이 바뀌어도 연결은 유지됩니다.'}
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
                  {GROUP_PERMISSION_META.filter((meta) => !meta.grantable)
                    // 담당 극단이 없는 계정은 소개할 '내 극단'이 없어 my-group을 빼고 보여준다
                    .filter((meta) => {
                      const lockedKeys: readonly string[] = isProgramTypeAccount
                        ? PROGRAM_TYPE_DEFAULT_PERMISSIONS
                        : GROUP_DEFAULT_PERMISSIONS
                      return lockedKeys.includes(meta.key)
                    })
                    .map((meta) => (
                      <li key={meta.key} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>
                          <span className="font-medium text-foreground">{meta.label}</span>
                          <span className="ml-1.5 text-xs">기본 제공</span>
                          <span className="block text-xs">
                            {isProgramTypeAccount && meta.key === 'programs'
                              ? '담당 공연 유형(낭독극·단막극) 작품의 소개, 포스터, 팜플렛을 등록·수정합니다.'
                              : meta.description}
                          </span>
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

          {/* 수정할 때는 비워두면 기존 비밀번호가 유지되므로 필수가 아니다 */}
          <Field label={isEditing ? '새 비밀번호 (변경할 때만 입력)' : '비밀번호'} required={!isEditing}>
            <Input
              type="password"
              autoComplete="new-password"
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

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
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
