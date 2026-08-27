// 프로그램/일정 카드 전반에서 재사용하는 표시용 설정값
export const programTypeConfig = {
  play: { label: '연극', bgClass: 'bg-primary', textClass: 'text-primary-foreground' },
  short_play: { label: '단막극', bgClass: 'bg-secondary', textClass: 'text-secondary-foreground' },
  reading: { label: '낭독극', bgClass: 'bg-accent', textClass: 'text-accent-foreground' },
} as const

// 회차별 예매 상태의 표시 방법.
// 예전에는 공개 화면과 관리자 화면이 라벨·색을 따로 갖고 있어 같은 상태가 다른 이름으로
// 보였다(예: '예약가능' vs '예매 가능'). 지금은 양쪽 모두 이 설정 하나만 쓴다.
export const seatStatusConfig = {
  available: { label: '예약가능', className: 'bg-green-100 text-green-800' },
  pending: { label: '예매대기', className: 'bg-gray-100 text-gray-700' },
  soldout: { label: '예매마감', className: 'bg-red-100 text-red-800' },
  ended: { label: '종료', className: 'bg-gray-500 text-white' },
} as const

export type SeatStatusKey = keyof typeof seatStatusConfig

/** 관리자 화면의 선택 목록. 실제 운영 순서(대기 → 가능 → 마감 → 종료)대로 둔다 */
export const seatStatusOptions: SeatStatusKey[] = ['pending', 'available', 'soldout', 'ended']

/**
 * 저장된 값을 화면에서 쓸 수 있는 상태로 바꿔준다.
 *
 * 없앤 'limited'(잔여석 적음)나 값이 비어 있는 예전 문서가 그대로 넘어오면
 * 배지가 통째로 사라지므로, 알 수 없는 값은 '예매대기'로 본다.
 * 실수로 '예약가능'처럼 보이는 것보다 대기로 보이는 쪽이 안전하기 때문이다.
 */
export function resolveSeatStatus(status: string | undefined | null): SeatStatusKey {
  return status && status in seatStatusConfig ? (status as SeatStatusKey) : 'pending'
}

export type TicketButtonMode = 'open' | 'pending' | 'soldout' | 'ended'

/** 예약 버튼 문구. 'open'일 때의 문구는 화면마다 달라서 부르는 쪽에서 정한다 */
export const ticketButtonLabel: Record<Exclude<TicketButtonMode, 'open'>, string> = {
  pending: '예약 오픈 예정',
  soldout: '예매마감',
  ended: '공연 종료',
}

/**
 * 회차 상태를 모아 예약 버튼을 어떻게 보여줄지 정한다.
 *
 * 예약 링크는 공연당 하나인데 회차 상태는 여러 개라 종합해서 판단해야 한다.
 * 배지는 '예매마감'인데 버튼은 '무료 예약하기'로 남는 엇갈림을 막는 것이 목적이다.
 */
export function resolveTicketButtonMode(
  statuses: Array<string | undefined | null>,
  hasTicketUrl: boolean
): TicketButtonMode {
  const resolved = statuses.map(resolveSeatStatus)

  // 회차가 아직 등록되지 않았으면 예매 링크 유무로만 판단한다 (예전과 같은 동작)
  if (resolved.length === 0) return hasTicketUrl ? 'open' : 'pending'

  if (resolved.every((status) => status === 'ended')) return 'ended'
  // 끝났거나 마감된 회차만 남았으면 더 예약할 수 없다
  if (resolved.every((status) => status === 'soldout' || status === 'ended')) return 'soldout'
  // 한 회차라도 예약할 수 있으면 링크를 연다
  if (resolved.some((status) => status === 'available')) return hasTicketUrl ? 'open' : 'pending'
  return 'pending'
}
