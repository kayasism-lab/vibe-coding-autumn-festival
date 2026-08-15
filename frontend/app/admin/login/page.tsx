'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

// 아이디만 저장(비밀번호는 브라우저 자체 비밀번호 관리자에 위임)
const SAVED_ID_KEY = 'admin_saved_id'

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberId, setRememberId] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const savedId = localStorage.getItem(SAVED_ID_KEY)
    if (savedId) {
      setFormData((prev) => ({ ...prev, email: savedId }))
      setRememberId(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        const role = result.data.user.role
        if (role !== 'superadmin' && role !== 'admin' && role !== 'group') {
          await fetch('/api/auth/logout', { method: 'POST' })
          setError('관리자 권한이 있는 계정만 접근할 수 있습니다.')
          return
        }

        if (rememberId) {
          localStorage.setItem(SAVED_ID_KEY, formData.email)
        } else {
          localStorage.removeItem(SAVED_ID_KEY)
        }

        router.push(role === 'group' ? '/admin/my-group' : '/admin')
        router.refresh()
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch {
      setError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          메인으로 돌아가기
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">관리자 로그인</CardTitle>
            <CardDescription>
              2026 가을연극축제 관리자 페이지입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="email">아이디</Label>
                <Input
                  id="email"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="관리자 아이디 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="비밀번호 입력"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberId"
                  checked={rememberId}
                  onCheckedChange={(checked) => setRememberId(Boolean(checked))}
                />
                <Label htmlFor="rememberId" className="text-sm font-normal cursor-pointer">
                  로그인 정보 저장
                </Label>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
