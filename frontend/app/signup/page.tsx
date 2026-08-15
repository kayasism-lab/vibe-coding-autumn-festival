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
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    theaterGroupName: '없음',
    password: '',
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
                <Field label="비밀번호"><Input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
