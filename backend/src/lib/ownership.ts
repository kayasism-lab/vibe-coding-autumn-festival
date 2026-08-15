import type { AuthPayload } from './auth.js'
import { User } from '../models/index.js'

// group 역할 계정이 ownerName(TheaterGroup.name 또는 Program.company)에 해당하는
// 리소스를 관리할 권한이 있는지 확인한다. superadmin/admin은 항상 허용.
export async function canManageGroupResource(
  authUser: AuthPayload,
  ownerName: string
): Promise<boolean> {
  if (authUser.role === 'superadmin' || authUser.role === 'admin') return true
  if (authUser.role !== 'group') return false

  const user = await User.findById(authUser.userId).select('theaterGroupName').lean()
  return !!user && user.theaterGroupName === ownerName
}
