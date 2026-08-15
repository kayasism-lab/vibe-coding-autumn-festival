import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ExternalLink, MapPin } from 'lucide-react'
import { formatScheduleDate } from '@/lib/format-date'
import { programTypeConfig, seatStatusConfig } from '@/lib/program-display'
import type { ProgramType, SeatStatus } from '@/types/index'

export interface ScheduleCardData {
  _id: string
  date: string
  time: string
  venue: string
  seatStatus: SeatStatus
  program: {
    _id: string
    title: string
    type: ProgramType
    company: string
    ticketUrl?: string
  }
}

// 일정 하나를 보여주는 카드. /schedule, /programs/[id] 에서 공통으로 사용
export function ScheduleCard({ schedule }: { schedule: ScheduleCardData }) {
  const dateInfo = formatScheduleDate(schedule.date)
  const type = programTypeConfig[schedule.program.type]
  const seat = seatStatusConfig[schedule.seatStatus]

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 transition-all hover:border-primary/30">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Date */}
        <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0 sm:w-20 flex-shrink-0">
          <div className="flex items-baseline gap-1 sm:block">
            <span className="text-2xl sm:text-3xl font-bold text-primary">{dateInfo.day}</span>
            <span className="text-sm text-muted-foreground sm:block">({dateInfo.dayOfWeek})</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={`${type.bgClass} ${type.textClass}`}>{type.label}</Badge>
            <Badge className={seat.className}>{seat.label}</Badge>
          </div>

          <Link
            href={`/programs/${schedule.program._id}`}
            className="text-lg font-semibold text-card-foreground hover:text-primary transition-colors"
          >
            {schedule.program.title}
          </Link>

          <p className="text-sm text-muted-foreground mt-1">{schedule.program.company}</p>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{schedule.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{schedule.venue}</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 self-center">
          {schedule.program.ticketUrl ? (
            <Button asChild size="sm">
              <a href={schedule.program.ticketUrl} target="_blank" rel="noopener noreferrer">
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
