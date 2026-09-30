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

export type UserRole = 'superadmin' | 'admin' | 'group' | 'rehearsal' | 'normal'

export interface UserForm {
  name: string
  email: string
  phone: string
  theaterGroup: string
  // 담당 극단이 없는 계정(낭독극·단막극 담당자)만 값이 있다. theaterGroup과 동시에 값을 갖지 않는다
  programType: ProgramTypeAccount | ''
  permissions: GroupPermission[]
  // 연습일지 작성 계정(role: 'rehearsal')만 값이 있다. 이 팀의 일지만 쓰고 고칠 수 있다
  rehearsalTeam: string
  // 낭독극 팀의 강사 계정인지. 낭독극은 강사만 일지를 쓰고 강사 코멘트를 남긴다
  rehearsalInstructor: boolean
  role: UserRole
  password: string
  /**
   * 요청자(지금 로그인한 계정)의 현재 비밀번호.
   * 비밀번호를 바꿀 때만 쓰며, 자리를 비운 사이 남이 계정을 가로채는 것을 막는다
   */
  currentPassword: string
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
  // 연습일지 설정에서 만든 팀 목록 (연습일지 작성 계정의 담당 팀 선택용)
  rehearsalTeams: { _id: string; name: string; title: string; kind: 'short_play' | 'reading' }[]
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
  rehearsalTeams,
  errorMessage,
  onSave,
}: Props) {
  const isGroupAccount = form.role === 'group'
  // 담당 극단 없이 공연 유형만 담당하는 계정(낭독극·단막극 담당자)인지
  const isProgramTypeAccount = isGroupAccount && !!form.programType
  // 고른 담당 팀이 낭독극 팀이면 강사 여부를 묻는다
  const isReadingTeam = rehearsalTeams.find((team) => team._id === form.rehearsalTeam)?.kind === 'reading'

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
                <SelectItem value="rehearsal">연습일지 계정 (단막극 팀원 · 낭독극 강사·수강생)</SelectItem>
                <SelectItem value="normal">일반회원</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {form.role === 'rehearsal' && (
            <Field label="담당 팀" required>
              <Select
                value={form.rehearsalTeam}
                // 팀을 바꾸면 강사 표시를 푼다 (단막극 팀에는 강사 구분이 없다)
                onValueChange={(rehearsalTeam) => setForm({ ...form, rehearsalTeam, rehearsalInstructor: false })}
              >
                <SelectTrigger><SelectValue placeholder="연습일지 팀을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {rehearsalTeams.map((team) => (
                    <SelectItem key={team._id} value={team._id}>
                      {team.kind === 'reading' ? team.name : `[단막극] ${team.name} · ${team.title}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isReadingTeam && (
                <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    checked={form.rehearsalInstructor}
                    onChange={(e) => setForm({ ...form, rehearsalInstructor: e.target.checked })}
                  />
                  <span>
                    <span className="font-medium">강사</span>
                    <span className="block text-xs text-muted-foreground">
                      표시하면 이 팀 일지를 쓰고 고치며 강사 코멘트를 남깁니다. 표시하지 않으면 수강생 계정으로, 일지를 보고 댓글만 답니다.
                    </span>
                  </span>
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                {rehearsalTeams.length === 0
                  ? '아직 만든 팀이 없습니다. 먼저 연습일지 설정에서 팀을 만들어주세요.'
                  : isReadingTeam
                    ? '로그인하면 연습일지 메뉴만 보이고, 낭독극 일지만 볼 수 있습니다. (삭제 불가)'
                    : '로그인하면 연습일지 메뉴만 보입니다. 단막극 모든 팀 일지를 볼 수 있고, 이 팀 일지만 쓰고 고칠 수 있습니다. (삭제 불가)'}
              </p>
            </Field>
          )}

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

          {/* 비밀번호를 실제로 바꿀 때만 본인 확인을 받는다.
              남의 계정을 바꿀 때도 대상의 옛 암호가 아니라 '지금 로그인한 나'의 암호를 넣는다 */}
          {isEditing && form.password.trim() !== '' && (
            <Field label="현재 로그인한 계정의 비밀번호" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                비밀번호를 바꾸려면 본인 확인이 필요합니다. 지금 로그인한 계정의 비밀번호를 입력해주세요.
              </p>
            </Field>
          )}

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
