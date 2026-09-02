'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, ExternalLink, ShieldCheck, Users } from 'lucide-react'
import {
  programTypeConfig,
  resolveSeatStatus,
  resolveTicketButtonMode,
  seatStatusConfig,
  ticketButtonLabel,
} from '@/lib/program-display'
import { formatScheduleDate } from '@/lib/format-date'
import { VenueMapButton, VenueAddressLink } from '@/components/shared/venue-map-button'
import { ImageLightbox, LightboxViewer } from '@/components/shared/image-lightbox'
import { ProgramPeriod } from '@/components/shared/program-period'
import { pageHeroImages } from '@/components/shared/page-header'
import { PosterPlaceholder } from '@/components/shared/poster-placeholder'
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
  // 포스터 크게 보기. 팜플렛과 같은 뷰어를 한 장짜리로 쓴다
  const [isPosterOpen, setIsPosterOpen] = useState(false)

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

  // 회차 상태를 종합해 예약 버튼을 어떻게 보여줄지 정한다.
  // 회차가 아직 없으면 예전처럼 예약 링크 유무로만 판단한다
  const ticketMode = resolveTicketButtonMode(
    schedules.map((schedule) => schedule.seatStatus),
    Boolean(program?.ticketUrl)
  )

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <div className="relative min-h-[320px] overflow-hidden bg-foreground lg:min-h-[420px]">
          <div className="absolute inset-0">
            <Image
              src={pageHeroImages.bulbs.src}
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
          </div>
          <div className="relative mx-auto flex min-h-[320px] max-w-7xl flex-col justify-end px-4 py-10 sm:px-6 lg:min-h-[420px] lg:px-8 lg:py-14">
            <Link href="/programs" className="mb-6 inline-flex items-center text-sm text-white/60 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              프로그램 목록으로
            </Link>
            {program && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {typeConfig[program.type].label}
                  </span>
                  {program.createdAt && <span className="text-sm text-white/50">{new Date(program.createdAt).toLocaleDateString('ko-KR')}</span>}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{program.title}</h1>
                  {/* 공연 기간은 등록된 회차에서 계산한다 (아래 회차 목록과 같은 자료) */}
                  <ProgramPeriod
                    dates={schedules.map((schedule) => schedule.date)}
                    className="text-base text-white/70"
                  />
                </div>
                <p className="mt-4 text-xl text-white/70">{program.company}</p>
              </>
            )}
            {isLoading && <p className="text-white/70">불러오는 중...</p>}
            {!isLoading && !program && <h1 className="text-2xl font-bold text-white">프로그램을 찾을 수 없습니다.</h1>}
          </div>
        </div>

        {program && (
          <section className="bg-background py-12 lg:py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8">
              <div className="lg:col-span-2">
                {/* 포스터는 눌러서 크게 볼 수 있다. 준비 중인 자리는 누를 것이 없어 그대로 둔다 */}
                {program.posterUrl ? (
                  <button
                    type="button"
                    onClick={() => setIsPosterOpen(true)}
                    aria-label={`${program.title} 포스터 크게 보기`}
                    className="relative mb-8 block aspect-[3/4] w-full max-w-md overflow-hidden rounded-xl bg-muted transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <img src={program.posterUrl} alt={`${program.title} 포스터`} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="relative mb-8 aspect-[3/4] max-w-md overflow-hidden rounded-xl bg-muted">
                    <PosterPlaceholder />
                  </div>
                )}

                <LightboxViewer
                  images={program.posterUrl ? [program.posterUrl] : []}
                  index={isPosterOpen ? 0 : null}
                  altPrefix={`${program.title} 포스터`}
                  onIndexChange={() => {}}
                  onClose={() => setIsPosterOpen(false)}
                />

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
                    <ImageLightbox images={program.galleryUrls} altPrefix={`${program.title} 공연 이미지`} />
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
                      value={
                        <>
                          {program.venue}
                          {/* 주소를 함께 노출해 아이콘 외에 글자로도 지도로 이동할 수 있게 한다 */}
                          <VenueAddressLink
                            address={program.venueAddress}
                            className="mt-0.5 block text-xs font-normal"
                          />
                        </>
                      }
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
                        const seat = seatStatusConfig[resolveSeatStatus(schedule.seatStatus)]
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

                {/* 예약 버튼 문구는 회차 상태를 종합해서 정한다 (/schedule 과 같은 규칙).
                    링크만 보고 열어두면 배지는 '예매마감'인데 버튼은 열려 있는 엇갈림이 생긴다 */}
                {ticketMode === 'open' ? (
                  <Button asChild className="w-full" size="lg">
                    <a href={program.ticketUrl} target="_blank" rel="noopener noreferrer">
                      무료 예약하기
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" size="lg" disabled>
                    {ticketButtonLabel[ticketMode]}
                  </Button>
                )}

                {/* 예약할 수 없을 때도 관람 방법은 알 수 있어야 한다 */}
                <Button asChild variant="ghost" className="w-full" size="sm">
                  <Link href="/tickets">관람 안내 보기</Link>
                </Button>

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

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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
