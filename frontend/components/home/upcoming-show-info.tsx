'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { formatProgramPeriod } from '@/lib/format-date'
import type { UpcomingShow } from '@/types/index'

/**
 * 극단 소개 팝업에 붙는 "앞으로 공연될 공연정보".
 *
 * 축제 공연(festival)은 공연일을 따로 저장하지 않고 그 프로그램의 회차에서 계산한다.
 * 회차 날짜를 고치면 여기 표시도 자동으로 따라가므로 두 곳을 맞출 필요가 없다.
 * 자체 공연(external)은 축제 일정에 없으므로 입력해 둔 날짜·주소를 그대로 쓴다.
 */
export function UpcomingShowInfo({ show }: { show?: UpcomingShow }) {
  const [festivalDates, setFestivalDates] = useState<string[]>([])

  const programId = show?.kind === 'festival' ? show.programId : undefined

  useEffect(() => {
    if (!programId) {
      setFestivalDates([])
      return
    }
    let cancelled = false
    fetch(`/api/schedules?programId=${programId}`)
      .then((res) => res.json())
      .then((data) => {
        // 팝업을 빠르게 닫았다 열면 응답이 뒤늦게 와서 엉뚱한 극단 정보가 남을 수 있어 막는다
        if (cancelled || !data.success) return
        setFestivalDates((data.data as Array<{ date: string }>).map((item) => item.date))
      })
      .catch(() => {
        // 회차를 못 받으면 날짜 없이 링크만 보여준다
      })
    return () => {
      cancelled = true
    }
  }, [programId])

  if (!show?.kind) return null

  const isFestival = show.kind === 'festival'
  const href = isFestival ? (programId ? `/programs/${programId}` : undefined) : show.url
  if (!href) return null

  // 시작일과 종료일이 같거나 종료일이 비어 있으면 formatProgramPeriod가 하루로 줄여준다
  const period = isFestival
    ? formatProgramPeriod(festivalDates)
    : formatProgramPeriod([show.date, show.endDate].filter(Boolean) as string[])

  return (
    <div className="text-sm">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-card-foreground">공연정보</span>
        {period && <span className="text-muted-foreground">{period}</span>}
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-muted-foreground">
          {isFestival ? '가을연극축제' : '일반공연'}
        </span>
        <span className="text-muted-foreground/50">·</span>
        {/* 축제 공연은 사이트 안의 상세로, 자체 공연은 등록해 둔 외부 주소로 보낸다 */}
        <a
          href={href}
          {...(isFestival ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          공연정보
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
