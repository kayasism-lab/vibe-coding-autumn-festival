/**
 * 공연 시간 입력을 돕는 값들.
 *
 * 회차 시각은 대체로 정해져 있어서 손으로 입력하다 한 시간씩 어긋나는 일이 있었다.
 * 그래서 자주 쓰는 시각을 눌러 넣을 수 있게 한다.
 *
 * 다만 어디까지나 거들 뿐이며 규칙으로 묶지 않는다.
 * 일요일에 두 번 공연하는 경우처럼 예외가 얼마든지 생기기 때문에,
 * 후보는 넉넉히 보여주고 시간 칸에 직접 입력하는 길도 항상 열어둔다.
 */

import type { ProgramType } from '@/types'

/** Date의 요일 번호 (0=일요일, 6=토요일) */
const SUNDAY = 0
const SATURDAY = 6

/**
 * 눌러서 넣을 수 있는 시각.
 * 요일이나 유형으로 걸러내지 않는다 - 일요일 2회 공연처럼 예외가 있어서다.
 */
const COMMON_TIMES = ['15:00', '18:00']

/**
 * 그날 첫 회차로 가장 흔한 시각. 빈 칸을 미리 채워둘 때만 쓴다.
 * 여기 없는 조합(평일 공연 등)은 정해진 관례가 없으므로 자동으로 채우지 않는다.
 */
const DEFAULT_START_TIME: Record<ProgramType, Partial<Record<number, string>>> = {
  play: { [SATURDAY]: '15:00', [SUNDAY]: '15:00' },
  short_play: { [SATURDAY]: '15:00', [SUNDAY]: '15:00' },
  reading: { [SATURDAY]: '15:00' },
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

/** "2026-09-19" → 6 (토). 형식이 어긋나면 null */
function getWeekday(dateString: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null

  // 날짜만 있는 문자열은 UTC 자정으로 해석되므로 요일도 UTC로 읽어야 어긋나지 않는다
  const date = new Date(`${dateString}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.getUTCDay()
}

export function getWeekdayName(dateString: string): string {
  const weekday = getWeekday(dateString)
  return weekday === null ? '' : WEEKDAY_NAMES[weekday]
}

/** 눌러서 넣을 수 있는 시각 목록. 날짜를 아직 고르지 않았으면 보여주지 않는다 */
export function getSuggestedTimes(dateString: string): string[] {
  return getWeekday(dateString) === null ? [] : COMMON_TIMES
}

/**
 * 비어 있는 시간 칸에 미리 넣어둘 시각.
 * 관례가 없는 날이면 null을 돌려주고 관리자가 직접 입력하게 둔다.
 */
export function getDefaultStartTime(
  programType: ProgramType | undefined,
  dateString: string
): string | null {
  if (!programType) return null

  const weekday = getWeekday(dateString)
  if (weekday === null) return null

  return DEFAULT_START_TIME[programType]?.[weekday] ?? null
}
