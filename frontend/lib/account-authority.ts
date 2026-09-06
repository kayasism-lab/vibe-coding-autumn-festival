/**
 * 계정을 누가 고치고 지울 수 있는지 판정한다.
 *
 * 백엔드 `backend/src/lib/account-authority.ts`와 같은 규칙을 쓴다.
 * 화면에서만 버튼을 감추면 요청을 직접 보내 우회할 수 있어 서버에서도 같은 검사를 한다.
 * 한쪽만 고치면 눌리는 버튼이 서버에서 막히므로 함께 고칠 것.
 */
import type { UserRole } from '@/components/admin/user-form-dialog'

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

/** 본인 계정이거나 자기보다 낮은 권한의 계정만 고칠 수 있다 */
export function canEditAccount(
  actor: { id: string; role: UserRole },
  target: { id: string; role: UserRole }
): boolean {
  if (actor.id === target.id) return true
  return isHigherRole(actor.role, target.role)
}

/** 삭제는 되돌릴 수 없어 본인 계정과 동급 계정까지 막고, 낮은 권한만 지울 수 있다 */
export function canDeleteAccount(
  actor: { id: string; role: UserRole },
  target: { id: string; role: UserRole }
): boolean {
  if (actor.id === target.id) return false
  return isHigherRole(actor.role, target.role)
}
