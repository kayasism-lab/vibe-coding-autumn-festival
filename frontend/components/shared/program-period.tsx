import { CalendarDays } from 'lucide-react'
import { formatProgramPeriod } from '@/lib/format-date'

/**
 * 공연명 옆에 붙는 공연 기간 표시. (예: "9/19(토) ~ 9/20(일)")
 *
 * 프로그램에는 날짜 필드가 없어서 등록된 회차 날짜로 계산한다.
 * 회차가 아직 없으면 아무것도 그리지 않는다.
 *
 * 목록·상세·예매안내·일정 네 화면에서 같은 모양으로 쓰려고 컴포넌트로 뺐다.
 * 글자색은 화면마다 달라(히어로 위에서는 흰 글씨) className으로 받는다.
 */
export function ProgramPeriod({
  dates,
  className = 'text-sm text-muted-foreground',
}: {
  dates: Array<string | Date>
  className?: string
}) {
  const period = formatProgramPeriod(dates)
  if (!period) return null

  return (
    <span className={`flex items-center gap-1 whitespace-nowrap ${className}`}>
      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
      {period}
    </span>
  )
}
