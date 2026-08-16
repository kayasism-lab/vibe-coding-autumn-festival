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
] as const

export type GroupPermission = (typeof GROUP_PERMISSIONS)[number]

// 극단 계정이라면 관리자가 따로 주지 않아도 항상 갖는 권한.
// 자기 극단 소개와 자기 극단 작품은 대표가 직접 관리하는 것이 당연하므로 기본으로 둔다.
export const GROUP_DEFAULT_PERMISSIONS: GroupPermission[] = ['my-group', 'programs']

// 관리자가 계정별로 켜고 끌 수 있는 추가 권한.
export const GRANTABLE_PERMISSIONS: GroupPermission[] = GROUP_PERMISSIONS.filter(
  (permission) => !GROUP_DEFAULT_PERMISSIONS.includes(permission)
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

// 실제로 계정이 가진 전체 권한 = 기본 권한 + 관리자가 부여한 권한
export function resolveGroupPermissions(granted?: string[] | null): GroupPermission[] {
  return [...GROUP_DEFAULT_PERMISSIONS, ...normalizeGrantedPermissions(granted)]
}
