/**
 * 축제 회차 시각 계산.
 *
 * 회차는 날짜(date)와 시각(time)을 나눠서 저장한다.
 * - date: "2026-09-19T00:00:00.000Z" 처럼 UTC 자정으로 저장된다. 날짜만 의미가 있다.
 * - time: "14:00" 같은 문자열이며, 관리자가 입력한 한국 시각이다.
 *
 * 그래서 이 둘을 합칠 때 반드시 한국 시각으로 해석해야 한다.
 * 예전 카운트다운은 `new Date('2026-09-19T00:00:00')`처럼 시간대 표기 없이 적어서,
 * 보는 사람의 컴퓨터 시간대에 따라 다른 순간을 세고 있었다.
 */

/** 한국은 UTC보다 9시간 빠르고 서머타임이 없다 */
const KST_OFFSET_HOURS = 9

/** 러닝타임이 등록되지 않은 작품의 공연 시간을 어림잡는 값(분) */
const DEFAULT_RUNTIME_MINUTES = 90

export type FestivalProgram = {
  _id: string
  title: string
  company?: string
  runtime?: number
}

export type FestivalSchedule = {
  _id: string
  date: string
  time: string
  venue: string
  programId: FestivalProgram | string
}

export function getScheduleProgram(schedule: FestivalSchedule): FestivalProgram | null {
  return typeof schedule.programId === 'string' ? null : schedule.programId
}

/**
 * 회차가 실제로 시작하는 순간.
 * time이 "14:00" 모양이 아니면 판단할 수 없으므로 null을 돌려주고 그 회차는 건너뛴다.
 */
export function getScheduleStart(schedule: FestivalSchedule): Date | null {
  const match = schedule.time?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null

  const date = new Date(schedule.date)
  if (Number.isNaN(date.getTime())) return null

  const hour = Number(match[1])
  const minute = Number(match[2])

  // 연·월·일을 UTC로 읽는다. 로컬 기준으로 읽으면 한국보다 서쪽 시간대에서 날짜가 하루 밀린다.
  // 시각에서 9시간을 빼는 것은 "한국 시각 14:00"을 UTC로 옮기기 위해서다.
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour - KST_OFFSET_HOURS,
      minute
    )
  )
}

export function getScheduleEnd(schedule: FestivalSchedule): Date | null {
  const start = getScheduleStart(schedule)
  if (!start) return null

  const runtime = getScheduleProgram(schedule)?.runtime || DEFAULT_RUNTIME_MINUTES
  return new Date(start.getTime() + runtime * 60 * 1000)
}

export type FestivalStatus =
  /** 등록된 회차가 아직 없음 */
  | { kind: 'empty' }
  /** 지금 공연 중 */
  | { kind: 'live'; schedule: FestivalSchedule; endsAt: Date; next: FestivalSchedule | null }
  /** 다음 공연을 기다리는 중 */
  | { kind: 'upcoming'; schedule: FestivalSchedule; startsAt: Date; next: FestivalSchedule | null }
  /** 모든 공연이 끝남 */
  | { kind: 'ended'; lastSchedule: FestivalSchedule }

/**
 * 회차 목록에서 지금 무엇을 보여줘야 하는지 정한다.
 * 공연 중 > 다음 공연 > 모두 종료 순으로 판단한다.
 */
export function resolveFestivalStatus(
  schedules: FestivalSchedule[],
  now: Date
): FestivalStatus {
  const sorted = schedules
    .map((schedule) => ({ schedule, start: getScheduleStart(schedule) }))
    .filter((entry): entry is { schedule: FestivalSchedule; start: Date } => entry.start !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  if (sorted.length === 0) return { kind: 'empty' }

  const liveIndex = sorted.findIndex(({ schedule, start }) => {
    const end = getScheduleEnd(schedule)
    return end !== null && start.getTime() <= now.getTime() && now.getTime() < end.getTime()
  })

  if (liveIndex !== -1) {
    return {
      kind: 'live',
      schedule: sorted[liveIndex].schedule,
      endsAt: getScheduleEnd(sorted[liveIndex].schedule) as Date,
      next: sorted[liveIndex + 1]?.schedule ?? null,
    }
  }

  const upcomingIndex = sorted.findIndex(({ start }) => start.getTime() > now.getTime())
  if (upcomingIndex !== -1) {
    return {
      kind: 'upcoming',
      schedule: sorted[upcomingIndex].schedule,
      startsAt: sorted[upcomingIndex].start,
      next: sorted[upcomingIndex + 1]?.schedule ?? null,
    }
  }

  return { kind: 'ended', lastSchedule: sorted[sorted.length - 1].schedule }
}

export type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

export function getTimeLeft(target: Date, now: Date): TimeLeft {
  const difference = target.getTime() - now.getTime()
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

/** 어느 시간대에서 보든 한국 시각으로 읽히도록 고정해서 표기한다 */
function formatKst(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(date)
}

/** 9월 19일 (토) */
export function formatFestivalDate(date: Date): string {
  return formatKst(date, { month: 'long', day: 'numeric', weekday: 'short' })
}

/**
 * 오후 2:00
 *
 * Intl에 맡기면 실행 환경에 따라 '오후'가 아니라 'PM'으로 나오는 경우가 있어,
 * 시·분만 한국 시각으로 받아온 뒤 오전/오후는 직접 붙인다.
 */
export function formatFestivalTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'

  return `${hour < 12 ? '오전' : '오후'} ${hour % 12 === 0 ? 12 : hour % 12}:${minute}`
}

/** 9월 19일 (토) 오후 2:00 */
export function formatFestivalDateTime(date: Date): string {
  return `${formatFestivalDate(date)} ${formatFestivalTime(date)}`
}

/** 한국 시각 기준으로 같은 날인지 */
export function isSameKstDay(a: Date, b: Date): boolean {
  const key = (date: Date) =>
    formatKst(date, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return key(a) === key(b)
}
