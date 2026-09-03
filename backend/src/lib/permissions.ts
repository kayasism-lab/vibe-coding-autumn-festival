// 극단 담당자(role: 'group') 계정이 관리자 화면에서 무엇을 다룰 수 있는지 정의한다.
// 권한 키는 관리자 메뉴 한 개와 1:1로 대응하며, 프론트엔드(frontend/lib/admin-permissions.ts)와
// 반드시 같은 값을 유지해야 한다.

export const GROUP_PERMISSIONS = [
  'my-group',
  'programs',
  'schedules',
  'gallery',
  'notices',
  'inquiries',
  'citizen-applications',
] as const

export type GroupPermission = (typeof GROUP_PERMISSIONS)[number]

// 극단 계정이라면 관리자가 따로 주지 않아도 항상 갖는 권한.
// 자기 극단 소개와 자기 극단 작품은 대표가 직접 관리하는 것이 당연하므로 기본으로 둔다.
export const GROUP_DEFAULT_PERMISSIONS: GroupPermission[] = ['my-group', 'programs']

// 담당 극단이 없는 계정(낭독극·단막극 담당자)의 기본 권한.
// 소개할 '내 극단'이 없으므로 my-group은 제외한다. citizen-applications(시민 참여
// 신청자 관리)는 극단 계정에는 애초에 해당 데이터가 없어 이쪽에만 기본으로 둔다.
export const PROGRAM_TYPE_DEFAULT_PERMISSIONS: GroupPermission[] = ['programs', 'citizen-applications']

// 관리자가 계정별로 켜고 끌 수 있는 추가 권한.
// 어느 한쪽이라도 기본 권한으로 이미 나오는 항목은 여기선 뺀다(중복 노출 방지).
export const GRANTABLE_PERMISSIONS: GroupPermission[] = GROUP_PERMISSIONS.filter(
  (permission) =>
    !GROUP_DEFAULT_PERMISSIONS.includes(permission) && !PROGRAM_TYPE_DEFAULT_PERMISSIONS.includes(permission)
)

export function isGroupPermission(value: unknown): value is GroupPermission {
  return typeof value === 'string' && (GROUP_PERMISSIONS as readonly string[]).includes(value)
}

// 저장 전 정규화: 허용된 키만 남기고, 기본 권한은 DB에 중복 저장하지 않는다.
// (기본 권한을 데이터로 갖고 있으면 나중에 기본값 정책이 바뀌었을 때 계정마다 값이 어긋난다)
export function normalizeGrantedPermissions(value: unknown): GroupPermission[] {
  if (!Array.isArray(value)) return []
  const unique = new Set(
    value.filter(isGroupPermission).filter((permission) => !GROUP_DEFAULT_PERMISSIONS.includes(permission))
  )
  return [...unique]
}

// 실제로 계정이 가진 전체 권한 = 기본 권한 + 관리자가 부여한 권한.
// hasTheaterGroup이 false면(담당 극단 없이 담당 공연 유형만 있는 계정) my-group을 기본에서 뺀다.
export function resolveGroupPermissions(
  granted?: string[] | null,
  hasTheaterGroup = true
): GroupPermission[] {
  const defaults = hasTheaterGroup ? GROUP_DEFAULT_PERMISSIONS : PROGRAM_TYPE_DEFAULT_PERMISSIONS
  return [...defaults, ...normalizeGrantedPermissions(granted)]
}
