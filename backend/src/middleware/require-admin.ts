import type { NextFunction, Request, Response } from 'express'
import { fail } from '../lib/http.js'
import { verifyAccessToken } from '../lib/auth.js'
import { hasAdminPermission } from '../lib/ownership.js'
import type { GroupPermission } from '../lib/permissions.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const token = bearer || req.cookies?.admin_token

  if (!token) {
    fail(res, '인증이 필요합니다.', 401)
    return
  }

  const user = await verifyAccessToken(token)
  if (!user) {
    fail(res, '인증이 만료되었거나 올바르지 않습니다.', 401)
    return
  }

  res.locals.user = user
  next()
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const role = res.locals.user?.role
    if (role !== 'superadmin' && role !== 'admin') {
      fail(res, '관리자 권한이 필요합니다.', 403)
      return
    }

    next()
  })
}

// theater-groups/programs 등 극단 계정(group)이 "본인 소속 리소스"에 한해 접근해야 하는
// 라우트에서만 사용. 소유권(내 극단이 맞는지) 체크는 각 라우트 핸들러에서 별도로 수행한다.
export async function requireAdminOrGroup(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const role = res.locals.user?.role
    if (role !== 'superadmin' && role !== 'admin' && role !== 'group') {
      fail(res, '관리자 권한이 필요합니다.', 403)
      return
    }

    next()
  })
}

// 특정 관리자 메뉴 권한을 가진 계정만 통과시킨다.
// 관리자는 항상 통과하고, 극단 계정은 기본 권한 또는 관리자가 부여한 권한이 있어야 한다.
export function requirePermission(permission: GroupPermission) {
  return async function permissionGuard(req: Request, res: Response, next: NextFunction) {
    await requireAdminOrGroup(req, res, async () => {
      if (!(await hasAdminPermission(res.locals.user, permission))) {
        fail(res, '이 기능을 사용할 권한이 없습니다.', 403)
        return
      }

      next()
    })
  }
}
