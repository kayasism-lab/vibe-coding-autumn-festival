// 프로그램/일정 카드 전반에서 재사용하는 표시용 설정값
export const programTypeConfig = {
  play: { label: '연극', bgClass: 'bg-primary', textClass: 'text-primary-foreground' },
  musical: { label: '뮤지컬', bgClass: 'bg-accent', textClass: 'text-accent-foreground' },
  short_play: { label: '단막극', bgClass: 'bg-secondary', textClass: 'text-secondary-foreground' },
} as const

export const seatStatusConfig = {
  available: { label: '예약가능', className: 'bg-green-100 text-green-800' },
  limited: { label: '잔여석 적음', className: 'bg-yellow-100 text-yellow-800' },
  soldout: { label: '마감', className: 'bg-red-100 text-red-800' },
} as const
