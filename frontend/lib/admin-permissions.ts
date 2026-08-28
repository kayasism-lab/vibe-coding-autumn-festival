// 관리자 화면에서 쓰는 권한 정의.
// 백엔드(backend/src/lib/permissions.ts)와 키 값이 반드시 같아야 한다.

export const GROUP_DEFAULT_PERMISSIONS = ['my-group', 'programs'] as const

export type GroupPermission =
  | 'my-group'
  | 'programs'
  | 'schedules'
  | 'gallery'
  | 'notices'
  | 'inquiries'

interface PermissionMeta {
  key: GroupPermission
  label: string
  description: string
  /** 관리자가 켜고 끌 수 있는지 (false면 극단 계정의 기본 권한) */
  grantable: boolean
}

// 사용자 관리 화면의 권한 체크박스와 사이드바 메뉴가 모두 이 목록을 기준으로 그려진다
export const GROUP_PERMISSION_META: PermissionMeta[] = [
  {
    key: 'my-group',
    label: '내 극단 관리',
    description: '극단 소개, 사진, SNS 링크를 수정합니다.',
    grantable: false,
  },
  {
    key: 'programs',
    label: '내 극단 작품 관리',
    description: '자기 극단 작품의 소개, 포스터, 팜플렛을 등록·수정합니다.',
    grantable: false,
  },
  {
    key: 'schedules',
    label: '공연 일정 관리',
    description: '자기 극단 작품의 공연 회차를 등록·수정합니다.',
    grantable: true,
  },
  {
    key: 'gallery',
    label: '갤러리 관리',
    description: '축제 사진·영상을 등록하고 수정합니다. (삭제는 관리자만)',
    grantable: true,
  },
  {
    key: 'notices',
    label: '게시판 관리',
    description: '공지·이벤트·보도자료·미디어 글을 작성하고 수정합니다. (삭제는 관리자만)',
    grantable: true,
  },
  {
    key: 'inquiries',
    label: '문의 답변',
    description: '관람객 문의를 확인하고 답변합니다.',
    grantable: true,
  },
]

export const GRANTABLE_PERMISSION_META = GROUP_PERMISSION_META.filter((meta) => meta.grantable)

export function isDefaultPermission(key: GroupPermission) {
  return (GROUP_DEFAULT_PERMISSIONS as readonly string[]).includes(key)
}

// 관리자 페이지 경로 → 필요한 권한.
// 여기에 없는 /admin 경로는 관리자 전용으로 취급한다(극단 계정 접근 불가).
const PATH_PERMISSIONS: { prefix: string; permission: GroupPermission }[] = [
  { prefix: '/admin/my-group', permission: 'my-group' },
  { prefix: '/admin/programs', permission: 'programs' },
  { prefix: '/admin/schedules', permission: 'schedules' },
  { prefix: '/admin/gallery', permission: 'gallery' },
  { prefix: '/admin/notices', permission: 'notices' },
  { prefix: '/admin/inquiries', permission: 'inquiries' },
]

/** 극단 계정이 해당 경로에 들어갈 수 있는지 판단한다 (관리자는 항상 허용) */
export function canGroupAccessPath(pathname: string, permissions: GroupPermission[]) {
  const matched = PATH_PERMISSIONS.find((entry) => pathname.startsWith(entry.prefix))
  if (!matched) return false
  return permissions.includes(matched.permission)
}
