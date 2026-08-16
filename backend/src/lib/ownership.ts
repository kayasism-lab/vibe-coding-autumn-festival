import type { Types } from 'mongoose'
import type { AuthPayload } from './auth.js'
import { User } from '../models/index.js'
import { resolveGroupPermissions, type GroupPermission } from './permissions.js'

export interface GroupContext {
  theaterGroupId: string | null
  theaterGroupName: string
  permissions: GroupPermission[]
}

// 로그인한 극단 담당자의 소속 극단과 최종 권한을 DB에서 읽어온다.
// 권한을 JWT에 넣지 않는 이유: 관리자가 권한을 회수해도 토큰이 만료될 때까지 남아버리기 때문.
export async function loadGroupContext(authUser: AuthPayload): Promise<GroupContext | null> {
  const user = await User.findById(authUser.userId)
    .select('theaterGroup theaterGroupName permissions')
    .lean<{ theaterGroup?: Types.ObjectId; theaterGroupName?: string; permissions?: string[] }>()

  if (!user) return null

  return {
    theaterGroupId: user.theaterGroup ? String(user.theaterGroup) : null,
    theaterGroupName: user.theaterGroupName ?? '',
    permissions: resolveGroupPermissions(user.permissions),
  }
}

// 해당 계정이 관리자 메뉴 하나에 접근할 수 있는지 확인한다.
export async function hasAdminPermission(
  authUser: AuthPayload,
  permission: GroupPermission
): Promise<boolean> {
  if (authUser.role === 'superadmin' || authUser.role === 'admin') return true
  if (authUser.role !== 'group') return false

  const context = await loadGroupContext(authUser)
  return !!context && context.permissions.includes(permission)
}

// group 역할 계정이 특정 리소스(작품·극단 정보 등)를 관리할 권한이 있는지 확인한다.
// 소유 극단 ID가 있으면 ID로 대조하고, 아직 연결되지 않은 예전 데이터는 극단명으로 대조한다.
// superadmin/admin은 항상 허용.
export async function canManageGroupResource(
  authUser: AuthPayload,
  ownerName: string,
  ownerGroupId?: Types.ObjectId | string | null
): Promise<boolean> {
  if (authUser.role === 'superadmin' || authUser.role === 'admin') return true
  if (authUser.role !== 'group') return false

  const context = await loadGroupContext(authUser)
  if (!context) return false

  if (ownerGroupId && context.theaterGroupId) {
    return String(ownerGroupId) === context.theaterGroupId
  }

  return !!context.theaterGroupName && context.theaterGroupName === ownerName
}
