import type { Types } from 'mongoose'
import type { AuthPayload } from './auth.js'
import { User } from '../models/index.js'
import { resolveGroupPermissions, type GroupPermission } from './permissions.js'
import type { GroupAccountProgramType } from '../types/index.js'

export interface GroupContext {
  theaterGroupId: string | null
  theaterGroupName: string
  // 담당 극단이 없는 계정(낭독극·단막극 담당자)만 값이 있다
  programType: GroupAccountProgramType | null
  permissions: GroupPermission[]
}

// 로그인한 극단 담당자의 소속 극단과 최종 권한을 DB에서 읽어온다.
// 권한을 JWT에 넣지 않는 이유: 관리자가 권한을 회수해도 토큰이 만료될 때까지 남아버리기 때문.
export async function loadGroupContext(authUser: AuthPayload): Promise<GroupContext | null> {
  const user = await User.findById(authUser.userId)
    .select('theaterGroup theaterGroupName programType permissions')
    .lean<{
      theaterGroup?: Types.ObjectId
      theaterGroupName?: string
      programType?: GroupAccountProgramType
      permissions?: string[]
    }>()

  if (!user) return null

  return {
    theaterGroupId: user.theaterGroup ? String(user.theaterGroup) : null,
    theaterGroupName: user.theaterGroupName ?? '',
    // theaterGroup이 있으면 그쪽이 우선이다 (둘 다 갖는 계정은 만들지 않지만, 방어적으로 처리)
    programType: user.theaterGroup ? null : user.programType ?? null,
    permissions: resolveGroupPermissions(user.permissions, !!user.theaterGroup),
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

// group 역할 계정이 특정 리소스(극단 정보 등)를 관리할 권한이 있는지 확인한다.
// 소유 극단 ID가 있으면 ID로 대조하고, 아직 연결되지 않은 예전 데이터는 극단명으로 대조한다.
// superadmin/admin은 항상 허용. 담당 극단이 없는(programType) 계정은 애초에 극단 소유 리소스를
// 다룰 일이 없으므로(내 극단 관리 권한을 안 받는다) 여기서는 항상 false가 된다.
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

// Program(작품)과 그 하위 자원(일정)의 소유권을 판정한다.
// - 담당 극단이 있는 계정: 그 극단이 주관하는 작품만
// - 담당 극단이 없는 계정(낭독극·단막극 담당자): 소유 극단이 없고(협의회 직접 주관)
//   담당 유형과 같은 작품만
export async function canManageProgram(
  authUser: AuthPayload,
  program: { company: string; theaterGroup?: Types.ObjectId | string | null; type: string }
): Promise<boolean> {
  if (authUser.role === 'superadmin' || authUser.role === 'admin') return true
  if (authUser.role !== 'group') return false

  const context = await loadGroupContext(authUser)
  if (!context) return false

  if (context.theaterGroupId) {
    if (program.theaterGroup) {
      return String(program.theaterGroup) === context.theaterGroupId
    }
    // 아직 극단 ID로 연결되지 않은 예전 데이터는 이름으로 대조한다
    return !!context.theaterGroupName && context.theaterGroupName === program.company
  }

  if (context.programType) {
    return !program.theaterGroup && program.type === context.programType
  }

  return false
}
