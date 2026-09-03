// 담당 극단 없이(협의회 직접 주관) 공연 유형만 담당하는 계정(낭독극·단막극 담당자) 관련 상수.
// 백엔드(backend/src/routes/users.ts의 PROGRAM_TYPE_ACCOUNT_LABELS)와 라벨을 맞춰야 한다.

export type ProgramTypeAccount = 'reading' | 'short_play'

export const PROGRAM_TYPE_ACCOUNT_OPTIONS: { value: ProgramTypeAccount; label: string }[] = [
  { value: 'reading', label: '열린 낭독극' },
  { value: 'short_play', label: '열린 단막극' },
]

export function programTypeAccountLabel(value: ProgramTypeAccount) {
  return PROGRAM_TYPE_ACCOUNT_OPTIONS.find((option) => option.value === value)?.label ?? value
}
