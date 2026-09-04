'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CitizenApplicationForm } from '@/components/citizen-application-form'
import { CitizenApplicationNoticeDialog } from '@/components/citizen-application-gate'
import {
  resolveCitizenApplicationMessage,
  resolveCitizenApplicationStatus,
  type CitizenApplicationStatus,
  type CitizenProgramType,
} from '@/lib/citizen-application-status'
import { CheckCircle2, Loader2 } from 'lucide-react'

/** 접수 상태 판정에 필요한 만큼만 추린 프로그램 값 */
interface ApplicationProgram {
  applicationStatus?: string | null
  openForApplication?: boolean | null
  applicationMessages?: { closed?: string; preparing?: string; ended?: string } | null
}

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

  // 접수 상태를 확인하기 전에는 폼도 팝업도 보여주지 않는다.
  // 폼이 잠깐 떴다가 팝업으로 덮이면 신청할 수 있는 것처럼 오해하게 된다
  const [program, setProgram] = useState<ApplicationProgram | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isCurrent = true
    setIsChecking(true)

    fetch(`/api/programs?type=${initialType}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return
        // 서버가 신청을 붙이는 기준(같은 유형 중 첫 번째 공개 작품)과 맞춘다
        setProgram(data.success ? (data.data?.[0] ?? null) : null)
      })
      .catch(() => {
        if (isCurrent) setProgram(null)
      })
      .finally(() => {
        if (isCurrent) setIsChecking(false)
      })

    // 유형이 바뀌면 이전 요청 결과는 버린다
    return () => {
      isCurrent = false
    }
  }, [initialType])

  const status: CitizenApplicationStatus = resolveCitizenApplicationStatus(program)

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
          hero="actor"
          subtitle="Join"
          title="시민 참여 신청"
          description="연극 경험이 없어도 누구나 열린 낭독극·열린 단막극에 참여를 신청할 수 있습니다."
        />

        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            {isChecking ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : status === 'open' ? (
              <Card>
                <CardContent className="pt-6">
                  {/* 유형별로 접수 상태가 다르므로, 확인을 마친 유형으로 고정해서 보여준다 */}
                  <CitizenApplicationForm
                    initialType={initialType}
                    isTypeLocked
                    onSuccess={() => setIsSubmitted(true)}
                  />
                </CardContent>
              </Card>
            ) : (
              <CitizenApplicationNoticeDialog
                type={initialType}
                status={status}
                message={resolveCitizenApplicationMessage(program, status)}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
