import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ExternalLink } from 'lucide-react'
import { formatScheduleDate } from '@/lib/format-date'
import { programTypeConfig, seatStatusConfig } from '@/lib/program-display'
import { VenueMapButton, VenueAddressLink } from '@/components/shared/venue-map-button'
import type { ProgramType, SeatStatus } from '@/types/index'

export interface ScheduleSession {
  _id: string
  date: string
  time: string
  seatStatus: SeatStatus
}

export interface ProgramScheduleGroup {
  program: {
    _id: string
    title: string
    type: ProgramType
    company: string
    ticketUrl?: string
    venueAddress?: string
  }
  venue: string
  sessions: ScheduleSession[]
}

// 공연 하나(프로그램) 기준으로 전체 회차를 모아 보여주는 카드.
// 실제 예약 페이지가 한 곳에서 회차를 선택하는 방식이라, 회차별 정보만 나열하고
// 예약 버튼은 공연당 하나만 둔다. /schedule 에서 사용.
export function ScheduleCard({ group }: { group: ProgramScheduleGroup }) {
  const type = programTypeConfig[group.program.type]

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 transition-all hover:border-primary/30">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={`${type.bgClass} ${type.textClass}`}>{type.label}</Badge>
          </div>

          <Link
            href={`/programs/${group.program._id}`}
            className="text-lg font-semibold text-card-foreground hover:text-primary transition-colors"
          >
            {group.program.title}
          </Link>

          <p className="text-sm text-muted-foreground mt-1">{group.program.company}</p>

          {/* 장소명 옆에 주소를 함께 노출하고, 아이콘·주소 모두 지도로 연결한다 (관람안내와 동일) */}
          <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 flex-shrink-0">
              <VenueMapButton address={group.program.venueAddress} />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>{group.venue}</span>
              <VenueAddressLink address={group.program.venueAddress} className="text-xs" />
            </div>
          </div>

          {/* 회차별 일정: 예약 버튼 없이 정보만 표시 */}
          <ul className="flex flex-wrap gap-2 mt-3">
            {group.sessions.map((session, index) => {
              const dateInfo = formatScheduleDate(session.date)
              const seat = seatStatusConfig[session.seatStatus]
              return (
                <li
                  key={session._id}
                  className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-card-foreground">{index + 1}회차</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {dateInfo.month}/{dateInfo.day}({dateInfo.dayOfWeek}) {session.time}
                  </span>
                  <Badge className={seat.className}>{seat.label}</Badge>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Action - 공연당 예약 링크는 하나만 */}
        <div className="flex-shrink-0 self-center">
          {group.program.ticketUrl ? (
            <Button asChild size="sm">
              <a href={group.program.ticketUrl} target="_blank" rel="noopener noreferrer">
                무료 예약
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              예약 오픈 예정
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
