/**
 * 관리 화면 로그인 유지 정책.
 *
 * 예전에는 관리 화면을 열어두기만 하면 화면이 주기적으로 세션을 연장해 사실상
 * 무기한 로그인 상태였다. 관리자 계정은 개인정보를 다루므로, 자리를 비운 사이
 * 남이 그대로 쓰지 못하도록 마지막 조작에서 일정 시간이 지나면 다시 로그인하게 한다.
 *
 * 로그인 시점이 아니라 '마지막 조작' 기준이라, 작업을 이어가는 동안에는 끊기지 않는다.
 */
import type { UserRole } from '../types/index.js'

/** 관리 화면 계정이 아무 조작 없이 로그인을 유지할 수 있는 시간 */
export const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000

/** 관리 화면에 들어올 수 있는 계정인지. 일반 회원은 이 정책을 적용하지 않는다 */
export function isAdminSessionRole(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'group'
}

/** 액세스 토큰 수명. 관리 화면 계정은 유휴 제한과 같은 길이로 맞춘다 */
export function accessTokenLifetime(role: UserRole): string {
  return isAdminSessionRole(role) ? '10m' : '15m'
}

/** 액세스 토큰 쿠키의 maxAge (밀리초). 위 수명과 같은 값을 써야 한다 */
export function accessCookieMaxAge(role: UserRole): number {
  return isAdminSessionRole(role) ? ADMIN_IDLE_TIMEOUT_MS : 15 * 60 * 1000
}

/**
 * 마지막 조작에서 너무 오래 지나 세션을 끊어야 하는지.
 * 활동 기록이 아예 없는 예전 계정은 로그인 직후로 보고 통과시킨다.
 */
export function isSessionIdleExpired(role: UserRole, lastActiveAt?: Date | null): boolean {
  if (!isAdminSessionRole(role)) return false
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() > ADMIN_IDLE_TIMEOUT_MS
}
