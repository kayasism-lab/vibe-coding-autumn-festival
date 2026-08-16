'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, ExternalLink, ShieldCheck, Users } from 'lucide-react'
import { programTypeConfig, seatStatusConfig } from '@/lib/program-display'
import { formatScheduleDate } from '@/lib/format-date'
import { VenueMapButton } from '@/components/shared/venue-map-button'
import { ImageLightbox } from '@/components/shared/image-lightbox'
import type { ProgramType, SeatStatus } from '@/types/index'

type Program = {
  _id: string
  title: string
  type: ProgramType
  company: string
  director?: string
  cast?: string[]
  runtime: number
  venue: string
  venueAddress?: string
  ageRating?: string
  synopsis: string
  detailContent?: string
  posterUrl?: string
  galleryUrls?: string[]
  pamphletUrls?: string[]
  ticketUrl?: string
  openForApplication?: boolean
  createdAt?: string
}

type ProgramSchedule = {
  _id: string
  date: string
  time: string
  venue: string
  seatStatus: SeatStatus
}

const typeConfig = programTypeConfig

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>()
  const [program, setProgram] = useState<Program | null>(null)
  const [schedules, setSchedules] = useState<ProgramSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/programs/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProgram(data.data)
      })
      .finally(() => setIsLoading(false))

    fetch(`/api/schedules?programId=${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSchedules(data.data)
      })
  }, [params.id])

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <div className="bg-foreground py-12 text-background lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link href="/programs" className="mb-6 inline-flex items-center text-sm text-background/70 hover:text-background">
              <ArrowLeft className="mr-2 h-4 w-4" />
              프로그램 목록으로
            </Link>
            {program && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge className={`${typeConfig[program.type].bgClass} ${typeConfig[program.type].textClass}`}>
                    {typeConfig[program.type].label}
                  </Badge>
                  {program.createdAt && <span className="text-background/60">{new Date(program.createdAt).toLocaleDateString('ko-KR')}</span>}
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{program.title}</h1>
                <p className="mt-4 text-xl text-background/70">{program.company}</p>
              </>
            )}
            {isLoading && <p className="text-background/70">불러오는 중...</p>}
            {!isLoading && !program && <h1 className="text-2xl font-bold">프로그램을 찾을 수 없습니다.</h1>}
          </div>
        </div>

        {program && (
          <section className="bg-background py-12 lg:py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8">
              <div className="lg:col-span-2">
                <div className="mb-8 max-w-md overflow-hidden rounded-xl bg-muted">
                  {program.posterUrl ? (
                    <img src={program.posterUrl} alt={program.title} className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center text-muted-foreground">포스터 준비 중</div>
                  )}
                </div>

                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-bold text-foreground">작품 소개</h2>
                  <div className="whitespace-pre-line leading-relaxed text-card-foreground/80">{program.synopsis}</div>
                </div>

                {program.detailContent && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-bold text-foreground">상세 안내</h2>
                    <div className="whitespace-pre-line leading-relaxed text-card-foreground/80">{program.detailContent}</div>
                  </div>
                )}

                {program.cast && program.cast.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-bold text-foreground">출연진</h2>
                    <div className="flex flex-wrap gap-2">
                      {program.cast.map((actor) => (
                        <Badge key={actor} variant="outline">{actor}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {program.galleryUrls && program.galleryUrls.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-bold text-foreground">공연 이미지</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {program.galleryUrls.map((url) => (
                        <div key={url} className="aspect-video overflow-hidden rounded-md bg-muted">
                          <img src={url} alt={program.title} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {program.pamphletUrls && program.pamphletUrls.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-foreground">팜플렛</h2>
                    <ImageLightbox images={program.pamphletUrls} altPrefix={`${program.title} 팜플렛`} />
                  </div>
                )}
              </div>

              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-card-foreground">공연 정보</h3>
                  <dl className="space-y-4">
                    <Info icon={<Clock className="h-5 w-5" />} label="러닝타임" value={`${program.runtime}분`} />
                    <Info
                      icon={<VenueMapButton address={program.venueAddress} iconClassName="h-5 w-5" />}
                      label="공연장"
                      value={program.venue}
                    />
                    {program.ageRating && <Info icon={<ShieldCheck className="h-5 w-5" />} label="관람 연령" value={program.ageRating} />}
                    {program.director && <Info icon={<Users className="h-5 w-5" />} label="연출" value={program.director} />}
                    <Info icon={<Calendar className="h-5 w-5" />} label="관람료" value="무료" />
                  </dl>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-card-foreground">공연 일정</h3>
                  {schedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">일정이 등록되면 안내해드립니다.</p>
                  ) : (
                    <ul className="space-y-3">
                      {schedules.map((schedule) => {
                        const dateInfo = formatScheduleDate(schedule.date)
                        const seat = seatStatusConfig[schedule.seatStatus]
                        return (
                          <li key={schedule._id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-card-foreground">
                              {dateInfo.month}/{dateInfo.day}({dateInfo.dayOfWeek}) {schedule.time}
                            </span>
                            <Badge className={seat.className}>{seat.label}</Badge>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                {program.ticketUrl ? (
                  <Button asChild className="w-full" size="lg">
                    <a href={program.ticketUrl} target="_blank" rel="noopener noreferrer">
                      무료 예약하기
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href="/tickets">관람 안내 보기</Link>
                  </Button>
                )}

                {program.openForApplication && (
                  <Button asChild variant="secondary" className="w-full" size="lg">
                    <Link href={`/apply/citizen?type=${program.type}`}>시민 참여 신청하기</Link>
                  </Button>
                )}
              </aside>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-medium text-card-foreground">{value}</dd>
      </div>
    </div>
  )
}
