// 비밀번호 확인 실패 횟수를 세어 무차별 대입을 막는다.
//
// 배경: 신청 내역 조회는 "전화번호 + 비밀번호" 조합이라 전화번호는 비밀 값이 아니다.
// 시도 제한이 없으면 전화번호를 아는 사람이 비밀번호를 반복 대입해
// 남의 개인정보(이름·나이·성별·거주지 등)를 열람할 수 있다.
//
// 키를 전화번호로 잡는 이유: 공격자는 IP를 바꿔가며 시도할 수 있지만
// 노리는 전화번호는 고정이라, 전화번호 기준이 실제 공격을 더 정확히 막는다.
//
// 한계: 메모리에만 기록하므로 서버가 재시작되면 초기화되고, 서버를 여러 대로
// 늘리면 인스턴스별로 따로 세어진다. 현재는 단일 인스턴스라 충분하지만,
// 확장 시에는 Redis 등 공용 저장소로 옮겨야 한다.

/** 차단까지 허용하는 실패 횟수 */
const MAX_ATTEMPTS = 5
/** 실패 횟수를 세는 기간 (10분) */
const WINDOW_MS = 10 * 60 * 1000
/** 한도를 넘겼을 때 차단하는 기간 (10분) */
const BLOCK_MS = 10 * 60 * 1000
/** 오래된 기록을 청소하는 주기 (30분) */
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000

interface AttemptRecord {
  count: number
  /** 현재 집계 구간이 시작된 시각 */
  windowStartedAt: number
  /** 차단 해제 시각. 차단 중이 아니면 0 */
  blockedUntil: number
}

const records = new Map<string, AttemptRecord>()

// 기록이 무한히 쌓이지 않도록 주기적으로 만료된 항목을 지운다.
// unref()로 두어 이 타이머가 프로세스 종료를 막지 않게 한다.
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, record] of records) {
    const expired = now - record.windowStartedAt > WINDOW_MS && record.blockedUntil < now
    if (expired) records.delete(key)
  }
}, CLEANUP_INTERVAL_MS)
cleanupTimer.unref?.()

/**
 * 현재 차단 중인지 확인한다.
 * @returns 차단 중이면 남은 시간(분), 아니면 null
 */
export function getBlockedMinutes(key: string): number | null {
  const record = records.get(key)
  if (!record) return null

  const now = Date.now()
  if (record.blockedUntil > now) {
    return Math.ceil((record.blockedUntil - now) / 60000)
  }

  // 차단이 끝났으면 기록을 비워 다시 처음부터 세게 한다
  if (record.blockedUntil !== 0) records.delete(key)
  return null
}

/** 비밀번호 확인에 실패했을 때 호출한다 */
export function recordFailure(key: string): void {
  const now = Date.now()
  const record = records.get(key)

  // 집계 구간이 지났으면 새 구간으로 시작
  if (!record || now - record.windowStartedAt > WINDOW_MS) {
    records.set(key, { count: 1, windowStartedAt: now, blockedUntil: 0 })
    return
  }

  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS
  }
}

/** 비밀번호 확인에 성공했을 때 호출해 실패 기록을 지운다 */
export function clearFailures(key: string): void {
  records.delete(key)
}

/** 테스트나 운영 점검용으로 전체 기록을 비운다 */
export function resetAllAttempts(): void {
  records.clear()
}
