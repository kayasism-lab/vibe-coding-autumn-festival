/**
 * 열린 단막극 연습일지 화면에서 함께 쓰는 타입과 도구.
 * 서버 규칙은 backend/src/lib/rehearsal-access.ts에 있고, 화면은 같은 규칙으로 버튼만 감춘다.
 */

export interface RehearsalTeam {
  _id: string
  title: string
  name: string
  director: string
  assistantDirector: string
  members: string[]
  order: number
  /** 팀원 계정 번호 (1이면 jik_short_1001~) */
  accountSeries?: number
}

export interface RehearsalLog {
  _id: string
  team: string
  date: string
  startTime: string
  endTime: string
  roster: string[]
  attendees: string[]
  topic: string
  content: string
  directorComment: string
  photos: string[]
  createdByName: string
  updatedByName: string
  createdAt: string
  updatedAt: string
  /** 팀 안에서 날짜순으로 센 번호. 서버가 계산해 준다 */
  sessionNo: number
}

/** 일지 쓰기·고치기 화면에서 다루는 값 */
export interface RehearsalLogDraft {
  team: string
  date: string
  startTime: string
  endTime: string
  attendees: string[]
  topic: string
  content: string
  directorComment: string
  photos: string[]
}

/** 로그인 계정이 연습일지에서 할 수 있는 일 */
export interface RehearsalAbility {
  canComment: boolean
  canDelete: boolean
  canManageTeams: boolean
  /** null이면 모든 팀 일지를 쓸 수 있다 */
  writableTeamId: string | null
}

/** /api/auth/me 결과로 할 수 있는 일을 정한다 (서버의 loadRehearsalAccess와 같은 규칙) */
export function resolveRehearsalAbility(account: {
  role: string
  permissions: string[]
  rehearsalTeam: string | null
}): RehearsalAbility {
  const isAdmin = account.role === 'superadmin' || account.role === 'admin'
  // 팀 설정 권한은 단막극 담당 계정만 자동으로 갖는다. 연출 코멘트도 같은 계정이 쓴다
  const isShortPlayManager = account.role === 'group' && account.permissions.includes('rehearsal-teams')
  return {
    canComment: isAdmin || isShortPlayManager,
    canDelete: isAdmin,
    canManageTeams: isAdmin || isShortPlayManager,
    // 계정 정보를 아직 못 읽었거나(role이 빈 값) 권한이 없으면 빈 문자열로 둬 어떤 팀에도 못 쓰게 한다.
    // null(모든 팀)로 두면 불러오는 잠깐 사이 '쓰기' 버튼이 모두에게 보인다
    writableTeamId:
      account.role === 'rehearsal'
        ? account.rehearsalTeam ?? ''
        : isAdmin || isShortPlayManager
          ? null
          : '',
  }
}

export function canWriteTeam(ability: RehearsalAbility, teamId: string) {
  return ability.writableTeamId === null || ability.writableTeamId === teamId
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → '2026년 10월 3일 (토)'. 시간대 영향을 받지 않도록 문자열을 직접 나눈다 */
export function formatLogDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  const weekday = DAY_LABELS[new Date(year, month - 1, day).getDay()]
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

/** '19:00'~'22:00' → '19:00 ~ 22:00 (3시간)'. 시간이 비어 있으면 있는 것만 보여준다 */
export function formatLogTime(startTime: string, endTime: string) {
  if (!startTime && !endTime) return ''
  if (!startTime || !endTime) return startTime || `~ ${endTime}`

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  const minutes = toMinutes(endTime) - toMinutes(startTime)
  if (minutes <= 0) return `${startTime} ~ ${endTime}`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const duration = [hours ? `${hours}시간` : '', rest ? `${rest}분` : ''].filter(Boolean).join(' ')
  return `${startTime} ~ ${endTime} (${duration})`
}

/** 오늘 날짜 'YYYY-MM-DD' (사용자 기기 시간 기준) */
export function todayString() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * 쓰고 있는 일지가 몇 번째 연습이 될지 미리 센다.
 * 서버와 같은 순서(날짜 → 시작 시간)로, 이 일지보다 앞선 일지 수 + 1.
 * 같은 날짜·시간이면 먼저 쓴 일지가 앞이라, 새 일지는 그 뒤에 온다
 */
export function previewSessionNo(teamLogs: RehearsalLog[], date: string, startTime: string, excludeId?: string) {
  const key = `${date} ${startTime}`
  const before = teamLogs.filter((log) => {
    if (log._id === excludeId) return false
    return `${log.date} ${log.startTime}` <= key
  })
  return before.length + 1
}

/* ── 작성 중 임시 저장 ──────────────────────────────────────────
 * 긴 일지를 쓰다가 로그인이 풀리거나 화면을 실수로 닫아도 내용이 남도록
 * 이 기기 브라우저에 잠시 보관한다. 저장에 성공하면 지운다.
 * 개인 브라우저 설정에 따라 저장소 접근 자체가 막힐 수 있어 모두 try로 감싼다.
 */

const DRAFT_PREFIX = 'rehearsal-draft:'

export function loadDraft(key: string): RehearsalLogDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key)
    return raw ? (JSON.parse(raw) as RehearsalLogDraft) : null
  } catch {
    return null
  }
}

export function saveDraft(key: string, draft: RehearsalLogDraft) {
  try {
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(draft))
  } catch {
    // 저장소가 막혀 있으면 임시 저장 없이 진행한다
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + key)
  } catch {
    // 위와 같은 이유로 무시한다
  }
}
