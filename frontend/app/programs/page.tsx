'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { PosterPlaceholder } from '@/components/shared/poster-placeholder'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock, Users } from 'lucide-react'
import { programTypeConfig as typeConfig } from '@/lib/program-display'
import { VenueMapButton, VenueAddressLink } from '@/components/shared/venue-map-button'
import { ProgramPeriod } from '@/components/shared/program-period'
import type { ProgramType } from '@/types/index'

type Program = {
  _id: string
  title: string
  type: ProgramType
  company: string
  director?: string
  runtime: number
  venue: string
  venueAddress?: string
  synopsis: string
  posterUrl?: string
}

/** /api/schedules 응답 중 공연 기간 계산에 필요한 부분만 */
type RawSchedule = {
  date: string
  programId: { _id: string } | null
}

const validTypes: Program['type'][] = ['play', 'reading', 'short_play']

export default function ProgramsPage() {
  return (
    <Suspense fallback={null}>
      <ProgramsPageContent />
    </Suspense>
  )
}

function ProgramsPageContent() {
  const searchParams = useSearchParams()
  const [programs, setPrograms] = useState<Program[]>([])
  // 키는 프로그램 id, 값은 그 공연의 회차 날짜 목록
  const [datesByProgram, setDatesByProgram] = useState<Record<string, string[]>>({})
  const [type, setType] = useState<'all' | Program['type']>('all')

  // 헤더 메뉴/홈 통계 카드 등 ?type=xxx 링크로 들어왔을 때 해당 필터를 바로 적용
  useEffect(() => {
    const requested = searchParams.get('type')
    if (requested && validTypes.includes(requested as Program['type'])) {
      setType(requested as Program['type'])
    }
  }, [searchParams])

  useEffect(() => {
    const query = type === 'all' ? '' : `?type=${type}`
    fetch(`/api/programs${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrograms(data.data)
      })
  }, [type])

  // 공연 기간은 프로그램이 아니라 회차에 들어 있어 따로 불러와 묶는다.
  // 필터(type)와 무관하게 전체를 한 번만 받아 두고 프로그램 id로 찾아 쓴다.
  useEffect(() => {
    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return
        const grouped: Record<string, string[]> = {}
        for (const schedule of data.data as RawSchedule[]) {
          const programId = schedule.programId?._id
          if (!programId) continue // 연결된 프로그램이 지워진 경우 방어
          if (!grouped[programId]) grouped[programId] = []
          grouped[programId].push(schedule.date)
        }
        setDatesByProgram(grouped)
      })
      .catch(() => {
        // 회차를 못 받으면 기간만 안 보이고 목록은 그대로 나온다
      })
  }, [])

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader hero="stage" subtitle="Programs" title="공연 프로그램" description="2026 가을연극축제 공연을 소개합니다." />
        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                ['all', '전체'],
                ['play', '연극'],
                ['reading', '낭독극'],
                ['short_play', '단막극'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setType(value as typeof type)}>
                  <Badge variant={type === value ? 'default' : 'outline'} className="cursor-pointer">{label}</Badge>
                </button>
              ))}
            </div>
            <div className="grid gap-8">
              {programs.map((program) => (
                <Link key={program._id} href={`/programs/${program._id}`} className="group block">
                  <article className="overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                    <div className="flex flex-col lg:flex-row">
                      <div className="relative h-48 flex-shrink-0 bg-muted lg:h-auto lg:w-64">
                        {program.posterUrl ? (
                          <img src={program.posterUrl} alt={`${program.title} 포스터`} className="h-full w-full object-cover" />
                        ) : (
                          <PosterPlaceholder />
                        )}
                      </div>
                      <div className="flex-1 p-6 lg:p-8">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className={`${typeConfig[program.type].bgClass} ${typeConfig[program.type].textClass}`}>{typeConfig[program.type].label}</Badge>
                        </div>
                        {/* 공연명 오른쪽에 회차에서 계산한 공연 기간을 붙인다 */}
                        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h2 className="text-xl font-bold transition-colors group-hover:text-primary lg:text-2xl">{program.title}</h2>
                          <ProgramPeriod dates={datesByProgram[program._id] ?? []} />
                        </div>
                        <p className="mb-4 text-muted-foreground">{program.company}</p>
                        <p className="mb-6 line-clamp-2 leading-relaxed text-card-foreground/80">{program.synopsis}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{program.runtime}분</span>
                          {/* 장소명 옆에 주소를 함께 노출하고, 아이콘·주소 모두 지도로 연결한다 */}
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="flex items-center gap-1">
                              <VenueMapButton address={program.venueAddress} />
                              {program.venue}
                            </span>
                            <VenueAddressLink address={program.venueAddress} className="text-xs" />
                          </span>
                          {program.director && <span className="flex items-center gap-1"><Users className="h-4 w-4" />연출: {program.director}</span>}
                        </div>
                        <div className="mt-6 flex items-center text-sm font-medium text-primary">자세히 보기<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
              {programs.length === 0 && <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">등록된 프로그램이 없습니다.</div>}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
