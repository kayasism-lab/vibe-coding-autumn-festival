import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import type { Response } from 'express'
import { env } from './env.js'

const JWT_SECRET = new TextEncoder().encode(env.jwtSecret)
const JWT_REFRESH_SECRET = new TextEncoder().encode(env.jwtRefreshSecret)

// group: 극단별 담당자 계정 - 본인 소속 극단 관련 리소스만 관리 가능
export type UserRole = 'superadmin' | 'admin' | 'group' | 'normal'

export interface AuthPayload extends JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export async function generateAccessToken(payload: Omit<AuthPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET)
}

export async function generateRefreshToken(payload: Omit<AuthPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AuthPayload
  } catch {
    return null
  }
}

/**
 * 리프레시 토큰 검증.
 * 액세스 토큰과 서명 키가 다르므로 따로 확인한다.
 */
export async function verifyRefreshToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    return payload as AuthPayload
  } catch {
    return null
  }
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
  }

  res.cookie('admin_token', accessToken, { ...base, maxAge: 15 * 60 * 1000 })
  res.cookie('admin_refresh_token', refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 })
}

/**
 * 액세스 토큰 쿠키만 새로 굽는다.
 *
 * 세션을 이어줄 때는 리프레시 토큰을 그대로 둔다. 함께 새로 발급하면
 * 관리자 화면을 여러 탭에 열어둔 경우 한쪽이 다른 쪽 토큰을 무효로 만든다.
 * 리프레시 토큰의 만료 시각은 로그인 시점 기준이라 7일 뒤에는 다시 로그인하게 된다.
 */
export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie('admin_token', accessToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 15 * 60 * 1000,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('admin_token', { path: '/' })
  res.clearCookie('admin_refresh_token', { path: '/' })
}
