/**
 * 계정을 누가 고치고 지울 수 있는지 판정한다.
 *
 * 예전에는 관리자 화면에 들어온 계정이면 서로의 계정을 마음대로 고칠 수 있었다.
 * 동급 관리자끼리 계정을 바꿔치기할 수 있어, 본인 계정과 자기보다 낮은 권한만
 * 건드릴 수 있도록 등급을 정해 비교한다.
 */
import type { UserRole } from '../types/index.js'

/** 숫자가 클수록 상위 권한 */
const ROLE_RANK: Record<UserRole, number> = {
  superadmin: 3,
  admin: 2,
  group: 1,
  normal: 0,
}

export function roleRank(role: UserRole): number {
  return ROLE_RANK[role] ?? 0
}

/** 요청자가 대상보다 상위 권한인지 */
export function isHigherRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return roleRank(actorRole) > roleRank(targetRole)
}

/**
 * 계정 정보를 고칠 수 있는지.
 * 본인 계정이거나, 자기보다 낮은 권한의 계정일 때만 허용한다.
 */
export function canEditAccount(
  actor: { userId: string; role: UserRole },
  target: { id: string; role: UserRole }
): boolean {
  if (actor.userId === target.id) return true
  return isHigherRole(actor.role, target.role)
}

/**
 * 계정을 지울 수 있는지.
 * 삭제는 되돌릴 수 없어 본인 계정과 동급 계정까지 막고, 낮은 권한만 지울 수 있게 한다.
 * (자기 계정을 지워 관리자 화면에 못 들어가는 사고를 막는 뜻도 있다)
 */
export function canDeleteAccount(
  actor: { userId: string; role: UserRole },
  target: { id: string; role: UserRole }
): boolean {
  if (actor.userId === target.id) return false
  return isHigherRole(actor.role, target.role)
}
