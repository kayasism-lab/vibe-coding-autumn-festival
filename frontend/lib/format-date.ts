const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 일정 카드에 쓰는 "9 (화)" 형태의 날짜 표시용 헬퍼
export function formatScheduleDate(dateString: string | Date) {
  const date = new Date(dateString)
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    dayOfWeek: DAY_LABELS[date.getDay()],
  }
}

// 일정을 "YYYY-MM" 월 단위로 묶을 때 쓰는 라벨 (예: "9월")
export function monthLabel(dateString: string | Date) {
  return `${new Date(dateString).getMonth() + 1}월`
}

/**
 * 회차 날짜들을 모아 공연 기간 문구를 만든다. (예: "9/19(토) ~ 9/20(일)")
 *
 * 프로그램에는 날짜 필드가 없고 회차(Schedule)에만 있어서, 등록된 회차의
 * 첫날과 마지막날로 기간을 계산한다. 회차를 고치면 기간도 알아서 따라간다.
 * 회차가 없거나 날짜가 모두 잘못된 값이면 null을 돌려주고, 화면에서는 아무것도 안 그린다.
 */
export function formatProgramPeriod(dates: Array<string | Date>): string | null {
  const times = dates
    .map((date) => new Date(date).getTime())
    .filter((time) => !Number.isNaN(time))
  if (times.length === 0) return null

  const first = formatScheduleDate(new Date(Math.min(...times)))
  const last = formatScheduleDate(new Date(Math.max(...times)))
  const firstLabel = `${first.month}/${first.day}(${first.dayOfWeek})`
  // 하루짜리 공연이면 같은 날짜를 두 번 쓰지 않는다
  if (first.month === last.month && first.day === last.day) return firstLabel
  return `${firstLabel} ~ ${last.month}/${last.day}(${last.dayOfWeek})`
}
