'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { PASSWORD_HINT, validatePassword } from '@/lib/password-policy'

interface Props {
  /** 처음 로그인이라 새 비밀번호가 반드시 필요한지 */
  isFirstLogin: boolean
  loginId: string
  /** 지금 이름. 처음 로그인 때는 아이디가 들어 있어 빈 칸으로 보여준다 */
  currentName: string
  onDone: () => void
}

/**
 * 연습일지 팀원 계정의 이름·비밀번호 설정.
 * 처음 로그인 때는 둘 다 정해야 연습일지가 열리고, 그 뒤에는 '내 정보'에서 언제든 고칠 수 있다
 */
export function AccountSetupForm({ isFirstLogin, loginId, currentName, onDone }: Props) {
  const [name, setName] = useState(currentName === loginId ? '' : currentName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const wantsPasswordChange = isFirstLogin || newPassword !== ''

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError('이름을 입력해주세요.')
    if (wantsPasswordChange) {
      const policyError = validatePassword(newPassword)
      if (policyError) return setError(policyError)
      if (newPassword === loginId) return setError('아이디와 다른 비밀번호를 정해주세요.')
      if (newPassword !== confirmPassword) return setError('새 비밀번호 확인이 맞지 않습니다.')
      if (!currentPassword) return setError('지금 비밀번호를 입력해주세요.')
    }

    setIsSaving(true)
    setError('')
    try {
      const res = await adminFetch('/api/rehearsal-accounts/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...(wantsPasswordChange ? { currentPassword, newPassword } : {}),
        }),
      })
      if (!res.ok) {
        setError(await getErrorMessage(res))
        return
      }
      onDone()
    } catch {
      setError('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
      {/* 브라우저가 새 비밀번호를 이 아이디에 저장하도록 알려주는 숨은 칸 */}
      <input type="text" name="username" autoComplete="username" value={loginId} readOnly hidden />
      <div className="space-y-1.5">
        <Label htmlFor="setup-name">이름</Label>
        <Input id="setup-name" className="h-11 text-base" placeholder="실명을 적어주세요" value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-muted-foreground">연습일지 작성자로 표시됩니다.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="setup-current">지금 비밀번호</Label>
        <Input id="setup-current" type="password" autoComplete="current-password" className="h-11 text-base" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        {isFirstLogin && <p className="text-xs text-muted-foreground">처음 받은 비밀번호(아이디와 같음)를 입력하세요.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="setup-new">새 비밀번호{!isFirstLogin && ' (바꿀 때만)'}</Label>
        <Input id="setup-new" type="password" autoComplete="new-password" className="h-11 text-base" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
      </div>
      {wantsPasswordChange && (
        <div className="space-y-1.5">
          <Label htmlFor="setup-confirm">새 비밀번호 확인</Label>
          <Input id="setup-confirm" type="password" autoComplete="new-password" className="h-11 text-base" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-11 w-full" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        저장
      </Button>
    </form>
  )
}
