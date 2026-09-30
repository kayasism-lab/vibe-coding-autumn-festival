'use client'

import { useEffect, useState } from 'react'
import type { GroupPermission } from '@/lib/admin-permissions'
import type { ProgramTypeAccount } from '@/lib/program-type-account'

interface AdminAccount {
  /** 로그인한 계정의 id. 본인 계정인지 가려낼 때 쓴다 */
  id: string
  role: string
  theaterGroup: string | null
  // 담당 극단이 없는 계정(낭독극·단막극 담당자)만 값이 있다
  programType: ProgramTypeAccount | null
  permissions: GroupPermission[]
  // 연습일지 작성 계정만 값이 있다 (이 팀의 일지만 쓰고 고칠 수 있다)
  rehearsalTeam: string | null
  // 연습일지 계정의 팀이 단막극인지 낭독극인지 (다른 계정은 null)
  rehearsalKind: 'short_play' | 'reading' | null
  // 낭독극 팀의 강사 계정인지. 낭독극은 강사만 일지를 쓴다
  rehearsalInstructor: boolean
}

/**
 * 관리자 화면에서 로그인 계정 정보를 읽어온다.
 * 극단 담당자 계정인지에 따라 목록 필터·삭제 버튼 노출이 달라지므로 여러 페이지에서 함께 쓴다.
 */
export function useAdminAccount() {
  const [account, setAccount] = useState<AdminAccount>({
    id: '',
    role: '',
    theaterGroup: null,
    programType: null,
    permissions: [],
    rehearsalTeam: null,
    rehearsalKind: null,
    rehearsalInstructor: false,
  })

  useEffect(() => {
    let mounted = true

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data.success) return
        setAccount({
          id: data.data.id ?? '',
          role: data.data.role,
          theaterGroup: data.data.theaterGroup ?? null,
          programType: data.data.programType ?? null,
          permissions: data.data.permissions ?? [],
          rehearsalTeam: data.data.rehearsalTeam ?? null,
          rehearsalKind: data.data.rehearsalKind ?? null,
          rehearsalInstructor: !!data.data.rehearsalInstructor,
        })
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  return { ...account, isGroupAccount: account.role === 'group' }
}
