import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { isSessionIdleExpired } from '../lib/session-policy.js'
import { validatePassword } from '../lib/password-policy.js'
import {
  clearAuthCookies,
  generateAccessToken,
  generateRefreshToken,
  setAccessCookie,
  setAuthCookies,
  verifyAccessToken,
  verifyPassword,
  verifyRefreshToken,
} from '../lib/auth.js'
import { requireAuth } from '../middleware/require-admin.js'
import { resolveGroupPermissions } from '../lib/permissions.js'
import type { UserRole } from '../types/index.js'
import { clearFailures, getBlockedMinutes, recordFailure } from '../lib/attempt-limiter.js'

export const authRouter = Router()

function publicUser(user: {
  _id: unknown
  email: string
  name: string
  phone: string
  theaterGroupName: string
  theaterGroup?: unknown
  programType?: string | null
  permissions?: string[]
  role: string
}) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    phone: user.phone,
    theaterGroupName: user.theaterGroupName,
    theaterGroup: user.theaterGroup ? String(user.theaterGroup) : null,
    // 담당 극단이 없는 계정(낭독극·단막극 담당자)만 값이 있다
    programType: user.theaterGroup ? null : user.programType ?? null,
    // 관리자 화면에서 메뉴를 그릴 때 쓰도록 최종 권한(기본+부여)을 계산해 내려준다
    permissions: user.role === 'group' ? resolveGroupPermissions(user.permissions, !!user.theaterGroup) : [],
    role: user.role,
  }
}

async function issueAuth(res: Parameters<typeof setAuthCookies>[0], user: {
  _id: { toString(): string }
  email: string
  // 극단 담당자(group)도 관리 화면에 로그인하므로 함께 다룬다
  role: UserRole
}) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  }
  const accessToken = await generateAccessToken(payload)
  const refreshToken = await generateRefreshToken(payload)

  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    lastLoginAt: new Date(),
    // 로그인 직후를 첫 조작으로 본다. 이 시각부터 유휴 시간을 잰다
    lastActiveAt: new Date(),
  })

  setAuthCookies(res, accessToken, refreshToken, user.role)
}

authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { name, email, phone, theaterGroupName, password, privacyAgreed, ageConfirmed, agreedAt } =
      req.body

    if (!name || !email || !phone || !password) {
      fail(res, '이름, 이메일, 연락처, 비밀번호를 입력해주세요.', 400)
      return
    }

    // 기존 회원의 비밀번호는 그대로 두고, 새로 가입하는 계정에만 적용된다
    const passwordError = validatePassword(password)
    if (passwordError) {
      fail(res, passwordError, 400)
      return
    }

    // 화면에서만 막으면 요청을 직접 보내 우회할 수 있어 서버에서도 검증한다
    if (privacyAgreed !== true) {
      fail(res, '개인정보 수집·이용에 동의해주세요.', 400)
      return
    }
    // 만 14세 미만 아동은 법정대리인 동의가 필요해 가입을 받지 않는다
    if (ageConfirmed !== true) {
      fail(res, '만 14세 이상인지 확인해주세요.', 400)
      return
    }

    const exists = await User.findOne({ email })
    if (exists) {
      fail(res, '이미 가입된 이메일입니다.', 409)
      return
    }

    const user = await User.create({
      name,
      email,
      phone,
      theaterGroupName: theaterGroupName || '없음',
      password: await bcrypt.hash(password, 12),
      role: 'normal',
      privacyAgreed: true,
      ageConfirmed: true,
      // 동의 시각은 클라이언트 값을 그대로 믿지 않고, 없으면 서버 시각으로 남긴다
      agreedAt: agreedAt ? new Date(agreedAt) : new Date(),
    })

    await issueAuth(res, user)
    ok(res, { user: publicUser(user) }, '회원가입이 완료되었습니다.', 201)
  })
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    // 문자열이 아니면(예: { $ne: null }) 여기서 막는다. 필터로 흘러가기 전에 차단한다
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      fail(res, '이메일과 비밀번호를 입력해주세요.', 400)
      return
    }

    // 로그인 무차별 대입을 막는다. 아이디(email) 기준으로 실패를 센다
    const key = `login:${email}`
    const blockedMinutes = getBlockedMinutes(key)
    if (blockedMinutes !== null) {
      fail(res, `로그인 시도가 많습니다. ${blockedMinutes}분 후에 다시 시도해주세요.`, 429)
      return
    }

    const user = await User.findOne({ email })
    if (!user || !(await verifyPassword(password, user.password))) {
      recordFailure(key)
      fail(res, '이메일 또는 비밀번호가 올바르지 않습니다.', 401)
      return
    }
    clearFailures(key)

    await issueAuth(res, user)
    ok(res, { user: publicUser(user) }, '로그인되었습니다.')
  })
)

/**
 * 끊긴 세션을 이어준다.
 *
 * 액세스 토큰은 15분이면 만료된다. 지금까지는 그것으로 끝이라 관리 화면에서
 * 사진을 여러 장 올리는 것처럼 시간이 걸리는 일을 하면 저장할 때 로그인이
 * 풀려 있었다. 로그인할 때 함께 발급한 리프레시 토큰(7일)이 있으면
 * 다시 로그인하지 않고 액세스 토큰만 새로 받는다.
 */
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.admin_refresh_token
    if (!token) {
      fail(res, '인증이 필요합니다.', 401)
      return
    }

    const payload = await verifyRefreshToken(token)
    if (!payload) {
      clearAuthCookies(res)
      fail(res, '다시 로그인해주세요.', 401)
      return
    }

    // 로그아웃하면 저장된 값이 비워지므로, 훔친 토큰으로는 세션을 이어갈 수 없다
    const user = await User.findById(payload.userId)
    if (!user || user.refreshToken !== token) {
      clearAuthCookies(res)
      fail(res, '다시 로그인해주세요.', 401)
      return
    }

    // 관리 화면 계정이 오래 아무 조작도 하지 않았다면 세션을 잇지 않는다.
    // 화면을 열어둔 것만으로 로그인이 유지되던 문제를 여기서 끊는다
    if (isSessionIdleExpired(user.role, user.lastActiveAt)) {
      clearAuthCookies(res)
      fail(res, '오랫동안 사용하지 않아 로그아웃되었습니다. 다시 로그인해주세요.', 401)
      return
    }

    const accessToken = await generateAccessToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    })
    setAccessCookie(res, accessToken, user.role)
    // 세션을 이었다는 것은 사용 중이라는 뜻이라 유휴 시간을 다시 센다
    await User.updateOne({ _id: user._id }, { lastActiveAt: new Date() })

    ok(res, { user: publicUser(user) }, '세션이 연장되었습니다.')
  })
)

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.admin_token
    const user = token ? await verifyAccessToken(token) : null
    const userId = user?.userId

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null })
    }

    clearAuthCookies(res)
    ok(res, null, '로그아웃되었습니다.')
  })
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const user = await User.findById(res.locals.user.userId).select('-password -refreshToken')
    if (!user) {
      fail(res, '사용자를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, publicUser(user))
  })
)
