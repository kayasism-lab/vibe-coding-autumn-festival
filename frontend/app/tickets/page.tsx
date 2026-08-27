'use client'

// 참고: 'use client' 페이지라 커스텀 메타데이터를 둘 수 없습니다. (Phase 7에서 서버 컴포넌트 분리 예정)

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Calendar, ExternalLink, Info, Loader2, Ticket, Users } from 'lucide-react'
import { programTypeConfig, resolveTicketButtonMode, ticketButtonLabel } from '@/lib/program-display'
import { VenueMapButton, VenueAddressLink } from '@/components/shared/venue-map-button'
import type { ProgramType } from '@/types/index'

interface Program {
  _id: string
  title: string
  type: ProgramType
  company: string
  venue: string
  venueAddress?: string
  ticketUrl?: string
}

/** /api/schedules 응답 중 예약 버튼 판단에 필요한 부분만 */
type RawSchedule = {
  seatStatus: string
  programId: { _id: string } | null
}

export default function TicketsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  // 예약 버튼 문구를 회차 상태에 맞추려면 회차도 있어야 해서 함께 불러온다.
  // 키는 프로그램 id, 값은 그 공연의 회차 상태 목록.
  const [statusesByProgram, setStatusesByProgram] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 회차를 못 불러와도 프로그램 목록은 보여야 하므로 각각 따로 처리한다
    fetch('/api/programs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrograms(data.data)
      })
      .finally(() => setIsLoading(false))

    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return
        const grouped: Record<string, string[]> = {}
        for (const schedule of data.data as RawSchedule[]) {
          const programId = schedule.programId?._id
          if (!programId) continue // 연결된 프로그램이 지워진 경우 방어
          if (!grouped[programId]) grouped[programId] = []
          grouped[programId].push(schedule.seatStatus)
        }
        setStatusesByProgram(grouped)
      })
      .catch(() => {
        // 회차를 못 받으면 예매 링크 유무로만 버튼이 정해진다 (예전과 같은 동작)
      })
  }, [])

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="chair"
          subtitle="Reservation"
          title="관람 안내"
          description="2026 가을연극축제는 전 프로그램 무료입니다. 사전 예약을 통해 회차별로 입장합니다."
        />

        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12">
              <div className="flex gap-4">
                <Info className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">무료 관람 안내</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    2026 가을연극축제의 모든 공연은 전석 무료이며, 사전 예약을 통해 회차별로
                    분산 입장합니다. 아래에서 공연별 예약 링크를 확인해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Program Cards */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {programs.map((program) => {
                  const type = programTypeConfig[program.type]
                  const ticketMode = resolveTicketButtonMode(
                    statusesByProgram[program._id] ?? [],
                    Boolean(program.ticketUrl)
                  )
                  return (
                    <Card key={program._id}>
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${type.bgClass} ${type.textClass}`}>{type.label}</Badge>
                          <Badge variant="outline" className="border-primary/40 text-primary">무료</Badge>
                        </div>
                        <CardTitle className="text-xl">{program.title}</CardTitle>
                        <CardDescription>{program.company}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* 장소명 옆에 주소를 함께 노출하고, 아이콘·주소 모두 지도로 연결한다 */}
                        <div className="mb-6 flex items-start gap-2 text-sm">
                          <span className="mt-0.5 flex-shrink-0">
                            <VenueMapButton address={program.venueAddress} />
                          </span>
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-muted-foreground">장소:</span>
                            <span className="font-medium">{program.venue}</span>
                            <VenueAddressLink address={program.venueAddress} className="text-xs" />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {ticketMode === 'open' ? (
                            <Button asChild className="flex-1">
                              <a href={program.ticketUrl} target="_blank" rel="noopener noreferrer">
                                무료 예약하기
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="secondary" className="flex-1" disabled>
                              {ticketButtonLabel[ticketMode]}
                            </Button>
                          )}
                          <Button variant="outline" asChild>
                            <Link href={`/programs/${program._id}`}>상세 정보</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {programs.length === 0 && (
                  <div className="md:col-span-2 rounded-xl border bg-card p-10 text-center text-muted-foreground">
                    등록된 프로그램이 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* Audience / Notice Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    관람 대상
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>서울시민 누구나 (가족 단위 관람 가능)</li>
                    <li>연극 작품은 12세 이상 관람가</li>
                    <li>일부 열린 단막극은 중학생 이상 관람가</li>
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground">
                    * 작품별 관람 연령은 공연 상세 페이지에서 확인해주세요.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    유의사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>공연 시작 10분 전부터 입장 가능합니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>공연 시작 후에는 입장이 제한될 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Ticket className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>전 프로그램 무료이며, 예약 좌석은 양도할 수 없습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>문의사항은 문의게시판을 이용해주세요.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
