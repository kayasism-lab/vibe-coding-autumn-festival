'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, PartyPopper, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  formatFestivalDate,
  formatFestivalDateTime,
  formatFestivalTime,
  getScheduleProgram,
  getScheduleStart,
  getTimeLeft,
  isSameKstDay,
  resolveFestivalStatus,
  type FestivalSchedule,
  type FestivalStatus,
  type TimeLeft,
} from '@/lib/festival-schedule'

/**
 * 홈 화면 상단의 공연 안내 띠.
 *
 * 예전에는 개막일을 코드에 적어두고 그때까지만 셌기 때문에, 첫 공연이 끝나면
 * 0으로 멈춘 채 남아 있었다. 지금은 등록된 회차를 읽어서
 * "다음 공연까지 남은 시간 → 공연 중 → 그다음 공연"으로 저절로 넘어간다.
 */
export function CountdownSection() {
  const [schedules, setSchedules] = useState<FestivalSchedule[] | null>(null)
  // 서버와 브라우저의 시각이 달라 화면이 어긋나는 것을 막으려고, 시계는 브라우저에서만 돌린다
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)

    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => setSchedules(data.success ? data.data : []))
      .catch(() => setSchedules([]))

    return () => clearInterval(timer)
  }, [])

  const status: FestivalStatus | null = useMemo(
    () => (schedules && now ? resolveFestivalStatus(schedules, now) : null),
    [schedules, now]
  )

  // 일정을 받아오기 전에는 그리지 않는다. 잘못된 남은 시간을 잠깐이라도 보여주지 않기 위해서다
  if (!status || !now) return null

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary via-pink-500 to-purple-500 py-16 text-white lg:py-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <Sparkles className="absolute left-1/4 top-8 h-6 w-6 animate-pulse text-white/30" />
        <PartyPopper
          className="absolute bottom-8 right-1/4 h-6 w-6 animate-pulse text-white/30"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StatusBody status={status} now={now} />
        <NextUpNote status={status} />
      </div>
    </section>
  )
}

/** 상태에 따라 가운데 내용이 통째로 바뀐다 */
function StatusBody({ status, now }: { status: FestivalStatus; now: Date }) {
  if (status.kind === 'empty') {
    return (
      <Intro
        badge="2026 Autumn Theater Festival"
        title="가을연극축제"
        description="공연 일정이 준비되는 대로 이곳에서 안내해 드립니다."
        action={{ href: '/programs', label: '작품 보기' }}
      />
    )
  }

  if (status.kind === 'ended') {
    return (
      <Intro
        badge="2026 Autumn Theater Festival"
        title="올해 축제가 막을 내렸습니다"
        description="함께해 주신 모든 분께 감사드립니다. 무대의 순간은 갤러리에 담아두었습니다."
        action={{ href: '/gallery', label: '갤러리 보기' }}
      />
    )
  }

  const program = getScheduleProgram(status.schedule)
  const programId = program?._id
  const isLive = status.kind === 'live'
  const startsAt = getScheduleStart(status.schedule)
  const isToday = startsAt ? isSameKstDay(startsAt, now) : false

  return (
    <div className="flex flex-col items-center justify-between gap-10 lg:flex-row">
      <div className="text-center lg:max-w-sm lg:text-left">
        {isLive ? (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
            {/* 지금 벌어지고 있는 일이라는 걸 한눈에 알리는 깜빡이는 점 */}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            지금 공연 중
          </span>
        ) : (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
            <PartyPopper className="h-4 w-4" />
            {isToday ? '오늘 공연' : '다음 공연'}
          </span>
        )}

        <h2 className="mb-2 text-3xl font-bold sm:text-4xl">{program?.title ?? '가을연극축제'}</h2>
        <p className="text-lg text-white/80">
          {program?.company && <span>{program.company}</span>}
          {startsAt && (
            <>
              {program?.company && <span className="mx-2 text-white/40">·</span>}
              <span>
                {isLive
                  ? `${formatFestivalTime(status.endsAt)} 종료 예정`
                  : formatFestivalDateTime(startsAt)}
              </span>
            </>
          )}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-white/70 lg:justify-start">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {status.schedule.venue}
        </p>
      </div>

      {status.kind === 'upcoming' ? (
        <Countdown target={status.startsAt} now={now} />
      ) : (
        <LiveBanner endsAt={status.endsAt} />
      )}

      <div className="flex-shrink-0">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-white px-8 font-semibold text-primary shadow-lg hover:bg-white/90"
        >
          <Link href={programId ? `/programs/${programId}` : '/schedule'}>
            {isLive ? '작품 보기' : '공연 정보'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function Countdown({ target, now }: { target: Date; now: Date }) {
  const timeLeft: TimeLeft = getTimeLeft(target, now)
  const units = [
    { key: 'days', value: timeLeft.days, label: '일' },
    { key: 'hours', value: timeLeft.hours, label: '시간' },
    { key: 'minutes', value: timeLeft.minutes, label: '분' },
    { key: 'seconds', value: timeLeft.seconds, label: '초' },
  ]

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      {units.map((unit, index) => (
        <div key={unit.key} className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-lg backdrop-blur-sm sm:h-24 sm:w-24">
              <span className="text-3xl font-bold tabular-nums sm:text-5xl">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="mt-3 text-xs font-medium text-white/70 sm:text-sm">{unit.label}</span>
          </div>
          {index < units.length - 1 && (
            <span className="-mt-6 text-3xl font-light text-white/50 sm:text-4xl">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

/** 공연 중에는 남은 시간을 세는 대신 무대가 열려 있다는 사실을 크게 알린다 */
function LiveBanner({ endsAt }: { endsAt: Date }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-8 py-6 backdrop-blur-sm sm:px-12">
      <span className="text-3xl font-bold sm:text-4xl">공연 중</span>
      <span className="text-sm text-white/80">{formatFestivalTime(endsAt)}에 끝납니다</span>
    </div>
  )
}

/** 그다음 순서를 한 줄로 덧붙여, 지금이 전체 일정 중 어디쯤인지 알 수 있게 한다 */
function NextUpNote({ status }: { status: FestivalStatus }) {
  if (status.kind !== 'live' && status.kind !== 'upcoming') return null
  if (!status.next) return null

  const nextProgram = getScheduleProgram(status.next)
  const nextStart = getScheduleStart(status.next)
  if (!nextStart) return null

  return (
    <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/20 pt-5 text-sm text-white/70">
      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">그다음</span>
      <span className="truncate">
        {nextProgram?.title ?? '다음 공연'}
        <span className="mx-2 text-white/40">·</span>
        {formatFestivalDate(nextStart)} {formatFestivalTime(nextStart)}
      </span>
    </div>
  )
}

/** 셀 공연이 없을 때(일정 미등록·전체 종료) 쓰는 안내 */
function Intro({
  badge,
  title,
  description,
  action,
}: {
  badge: string
  title: string
  description: string
  action: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
      <div>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
          <PartyPopper className="h-4 w-4" />
          {badge}
        </span>
        <h2 className="mb-2 text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="text-lg text-white/80">{description}</p>
      </div>
      <Button
        asChild
        size="lg"
        className="flex-shrink-0 rounded-full bg-white px-8 font-semibold text-primary shadow-lg hover:bg-white/90"
      >
        <Link href={action.href}>
          {action.label}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
