'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

interface Program {
  _id: string
  title: string
  openForApplication: boolean
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  sido: '',
  gu: '',
  motivation: '',
  experience: '',
  password: '',
}

export default function ProgramApplyPage() {
  const params = useParams<{ id: string }>()
  const [program, setProgram] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetch(`/api/programs/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProgram(data.data)
      })
      .finally(() => setIsLoading(false))
  }, [params.id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/citizen-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: params.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          region: { sido: form.sido, gu: form.gu },
          motivation: form.motivation,
          experience: form.experience,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setIsSubmitted(true)
      } else {
        setError(data.error || '신청에 실패했습니다.')
      }
    } catch {
      setError('신청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center pt-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    )
  }

  if (!program || !program.openForApplication) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16 text-center">
          <h1 className="text-xl font-bold text-foreground">시민 참여 신청을 받지 않는 프로그램입니다.</h1>
          <Button asChild variant="outline">
            <Link href="/programs">프로그램 목록으로</Link>
          </Button>
        </main>
        <Footer />
      </>
    )
  }

  if (isSubmitted) {
    return (
      <>
        <Header />
        <main className="pt-[9.5rem] min-h-screen">
          <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground">신청이 접수되었습니다</h1>
            <p className="mb-8 text-muted-foreground">
              입력하신 전화번호와 비밀번호로 언제든지 신청 내역을 확인·수정하실 수 있습니다.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/apply/status">신청 내역 조회</Link>
              </Button>
              <Button asChild>
                <Link href="/programs">프로그램 목록으로</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-[9.5rem]">
        <PageHeader
          subtitle="Join"
          title="시민 참여 신청"
          description={`「${program.title}」에 참여를 신청합니다. 연극 경험이 없어도 누구나 신청할 수 있습니다.`}
        />

        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Link href={`/programs/${program._id}`} className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              공연 정보로 돌아가기
            </Link>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="이름 *">
                      <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label="전화번호 *">
                      <Input required type="tel" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="이메일 *">
                    <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="거주 지역 - 시/도 *">
                      <Input required placeholder="예: 서울특별시" value={form.sido} onChange={(e) => setForm({ ...form, sido: e.target.value })} />
                    </Field>
                    <Field label="거주 지역 - 구 *">
                      <Input required placeholder="예: 관악구" value={form.gu} onChange={(e) => setForm({ ...form, gu: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="신청 계기 *">
                    <Textarea required rows={4} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} placeholder="참여하고 싶은 이유를 자유롭게 작성해주세요." />
                  </Field>

                  <Field label="관련 경력 (선택)">
                    <Textarea rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="연극·낭독·공연 관련 경험이 있다면 적어주세요. 없어도 괜찮습니다." />
                  </Field>

                  <Field label="비밀번호 *">
                    <Input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="신청 내역 조회·수정 시 사용합니다" />
                  </Field>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    신청하기
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
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
