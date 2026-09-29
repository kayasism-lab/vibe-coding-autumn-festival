import type { NextFunction, Request, Response } from 'express'
import { fail } from '../lib/http.js'
import { loadRehearsalAccess } from '../lib/rehearsal-access.js'
import { requireAuth } from './require-admin.js'

/**
 * 연습일지 API 공통 관문.
 * 로그인 계정의 연습일지 권한을 res.locals.rehearsal에 담아 두고,
 * 연습일지를 볼 수 없는 계정은 여기서 돌려보낸다
 */
export async function requireRehearsalAccess(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const access = await loadRehearsalAccess(res.locals.user)
    if (!access.canView) {
      fail(res, '연습일지를 볼 권한이 없습니다.', 403)
      return
    }
    // 처음 받은 비밀번호 그대로면 이름·비밀번호를 정하기 전까지 연습일지를 막는다.
    // 화면에서도 설정 화면을 먼저 띄우지만, 요청을 직접 보내는 경우까지 여기서 막는다
    if (access.mustChangePassword) {
      fail(res, '처음 로그인하셨습니다. 이름과 새 비밀번호를 먼저 정해주세요.', 403)
      return
    }
    res.locals.rehearsal = access
    next()
  })
}
