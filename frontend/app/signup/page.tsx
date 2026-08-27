'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PrivacyConsent,
  emptyConsent,
  validateConsent,
  type PrivacyConsentValue,
} from '@/components/shared/privacy-consent'
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH, validatePassword } from '@/lib/password-policy'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [consent, setConsent] = useState<PrivacyConsentValue>(emptyConsent)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    theaterGroupName: '없음',
    password: '',
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const passwordError = validatePassword(form.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // 만 14세 미만 아동은 법정대리인 동의가 필요해 가입을 받지 않는다
    const consentError = validateConsent(consent, true, '만 14세 이상인지 확인에 체크해주세요.')
    if (consentError) {
      setError(consentError)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // 동의 사실에 대한 입증 책임이 운영자에게 있어 함께 저장한다
          privacyAgreed: consent.privacyAgreed,
          ageConfirmed: consent.ageConfirmed,
          agreedAt: new Date().toISOString(),
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || '회원가입에 실패했습니다.')
        return
      }

      router.push('/community')
      router.refresh()
    } catch {
      setError('회원가입 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[8.25rem]">
        <section className="mx-auto max-w-md px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>회원가입</CardTitle>
              <CardDescription>커뮤니티 게시글과 사진 업로드를 위해 가입해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="이름"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="이메일"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="연락처"><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="소속 극단명">
                  <Input required value={form.theaterGroupName} onChange={(e) => setForm({ ...form, theaterGroupName: e.target.value })} placeholder="단원이 아니라면 없음이라고 적어주세요" />
                </Field>
                <Field label="비밀번호" hint={PASSWORD_HINT}><Input required minLength={PASSWORD_MIN_LENGTH} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                <PrivacyConsent
                  purpose="회원 가입 및 관리, 커뮤니티 게시판 이용에 따른 본인 식별"
                  items="이름, 이메일주소, 연락처, 소속 극단명"
                  retention="회원 탈퇴 요청 시까지 (탈퇴 시 지체 없이 파기)"
                  disadvantage="회원 가입이 제한됩니다."
                  ageLabel="만 14세 이상입니다."
                  value={consent}
                  onChange={setConsent}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  가입하기
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                이미 계정이 있다면 <Link href="/admin/login" className="text-primary hover:underline">로그인</Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Field({
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
