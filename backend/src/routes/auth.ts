import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import {
  clearAuthCookies,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  verifyAccessToken,
  verifyPassword,
} from '../lib/auth.js'
import { requireAuth } from '../middleware/require-admin.js'

export const authRouter = Router()

function publicUser(user: {
  _id: unknown
  email: string
  name: string
  phone: string
  theaterGroupName: string
  role: string
}) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    phone: user.phone,
    theaterGroupName: user.theaterGroupName,
    role: user.role,
  }
}

async function issueAuth(res: Parameters<typeof setAuthCookies>[0], user: {
  _id: { toString(): string }
  email: string
  role: 'superadmin' | 'admin' | 'normal'
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
  })

  setAuthCookies(res, accessToken, refreshToken)
}

authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { name, email, phone, theaterGroupName, password } = req.body

    if (!name || !email || !phone || !password) {
      fail(res, '이름, 이메일, 연락처, 비밀번호를 입력해주세요.', 400)
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
    })

    await issueAuth(res, user)
    ok(res, { user: publicUser(user) }, '회원가입이 완료되었습니다.', 201)
  })
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      fail(res, '이메일과 비밀번호를 입력해주세요.', 400)
      return
    }

    const user = await User.findOne({ email })
    if (!user || !(await verifyPassword(password, user.password))) {
      fail(res, '이메일 또는 비밀번호가 올바르지 않습니다.', 401)
      return
    }

    await issueAuth(res, user)
    ok(res, { user: publicUser(user) }, '로그인되었습니다.')
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
