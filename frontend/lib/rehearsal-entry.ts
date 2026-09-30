'use client'

import { useEffect, useState } from 'react'

/**
 * 공개 화면(헤더 메뉴·홈 바로가기)에 두는 '연습일지' 입구의 주소.
 * 로그인 화면은 이미 로그인한 사람을 따로 보내 주지 않으므로,
 * 연습일지를 볼 수 있는 계정으로 로그인돼 있으면 목록으로 바로 보낸다.
 */
export const REHEARSAL_LOGIN_HREF = '/admin/login?for=rehearsal'
export const REHEARSAL_HOME_HREF = '/admin/rehearsal-logs'

/** /api/auth/me 결과로 입구 주소를 정한다. 규칙은 로그인 화면의 canOpenRehearsal과 같다 */
export function resolveRehearsalEntryHref(me: { success?: boolean; data?: { role?: string; permissions?: string[] } }) {
  const role = me.data?.role
  const canOpen =
    !!me.success && (role === 'superadmin' || role === 'admin' || (me.data?.permissions ?? []).includes('rehearsal-logs'))
  return canOpen ? REHEARSAL_HOME_HREF : REHEARSAL_LOGIN_HREF
}

/** 헤더처럼 로그인 정보를 따로 읽지 않는 화면에서 쓰는 입구 주소 */
export function useRehearsalEntryHref() {
  const [href, setHref] = useState(REHEARSAL_LOGIN_HREF)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setHref(resolveRehearsalEntryHref(data))
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return href
}
