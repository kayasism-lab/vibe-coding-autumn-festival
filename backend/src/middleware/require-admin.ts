import type { NextFunction, Request, Response } from 'express'
import { fail } from '../lib/http.js'
import { verifyAccessToken } from '../lib/auth.js'

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
