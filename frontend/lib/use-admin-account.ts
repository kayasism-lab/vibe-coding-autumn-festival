'use client'

import { useEffect, useState } from 'react'
import type { GroupPermission } from '@/lib/admin-permissions'

interface AdminAccount {
  role: string
  theaterGroup: string | null
  permissions: GroupPermission[]
}

/**
 * 관리자 화면에서 로그인 계정 정보를 읽어온다.
 * 극단 담당자 계정인지에 따라 목록 필터·삭제 버튼 노출이 달라지므로 여러 페이지에서 함께 쓴다.
 */
export function useAdminAccount() {
  const [account, setAccount] = useState<AdminAccount>({
    role: '',
    theaterGroup: null,
    permissions: [],
  })

  useEffect(() => {
    let mounted = true

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data.success) return
        setAccount({
          role: data.data.role,
          theaterGroup: data.data.theaterGroup ?? null,
          permissions: data.data.permissions ?? [],
        })
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  return { ...account, isGroupAccount: account.role === 'group' }
}
