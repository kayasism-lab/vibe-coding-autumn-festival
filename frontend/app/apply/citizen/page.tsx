'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CitizenApplicationForm, type CitizenProgramType } from '@/components/citizen-application-form'
import { CheckCircle2 } from 'lucide-react'

export default function CitizenApplyPage() {
  return (
    <Suspense fallback={null}>
      <CitizenApplyPageContent />
    </Suspense>
  )
}

function CitizenApplyPageContent() {
  const searchParams = useSearchParams()
  const requestedType = searchParams.get('type')
  const initialType: CitizenProgramType = requestedType === 'short_play' ? 'short_play' : 'reading'
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (isSubmitted) {
    return (
      <>
        <Header />
        <main className="pt-[8.25rem] min-h-screen">
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
      <main className="pt-[8.25rem]">
        <PageHeader
          subtitle="Join"
          title="시민 참여 신청"
          description="연극 경험이 없어도 누구나 열린 낭독극·열린 단막극에 참여를 신청할 수 있습니다."
        />

        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="pt-6">
                <CitizenApplicationForm initialType={initialType} onSuccess={() => setIsSubmitted(true)} />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
