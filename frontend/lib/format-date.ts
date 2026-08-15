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
