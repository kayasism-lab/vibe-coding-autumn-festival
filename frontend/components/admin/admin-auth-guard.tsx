'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { canGroupAccessPath, resolveGroupHomeHref, type GroupPermission } from '@/lib/admin-permissions'
import { AccountSetupForm } from '@/components/admin/rehearsal/account-setup-form'

type MeResponse = {
  success: boolean
  data?: {
    role: 'superadmin' | 'admin' | 'group' | 'rehearsal' | 'normal'
    permissions?: GroupPermission[]
    email?: string
    name?: string
    mustChangePassword?: boolean
  }
}

// setup: 연습일지 팀원 계정이 처음 로그인해 이름·비밀번호부터 정해야 하는 상태
type GuardState = 'checking' | 'allowed' | 'forbidden' | 'setup'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<GuardState>('checking')
  // '접근 권한 없음' 화면에서 "돌아가기" 링크를 계산하는 데 쓴다 (my-group이 없는 계정도 있음)
  const [permissions, setPermissions] = useState<GroupPermission[]>([])
  const [account, setAccount] = useState({ email: '', name: '' })

  useEffect(() => {
    if (pathname === '/admin/login') {
      setState('allowed')
      return
    }

    let mounted = true

    fetch('/api/auth/me')
      .then((res) => res.json() as Promise<MeResponse>)
      .then((data) => {
        if (!mounted) return
        const role = data.data?.role

        if (
          !data.success ||
          (role !== 'superadmin' && role !== 'admin' && role !== 'group' && role !== 'rehearsal')
        ) {
          router.replace('/admin/login')
          return
        }

        // 극단 담당자·연습일지 계정은 권한이 있는 메뉴에만 들어갈 수 있다.
        // 주소를 직접 입력해 들어와도 여기서 막는다.
        const myPermissions = data.data?.permissions ?? []
        if ((role === 'group' || role === 'rehearsal') && !canGroupAccessPath(pathname, myPermissions)) {
          setPermissions(myPermissions)
          setState('forbidden')
          return
        }

        // 처음 받은 비밀번호(아이디와 같음) 그대로인 팀원 계정은 설정부터 하게 한다.
        // 서버도 설정 전에는 연습일지 요청을 막는다
        if (role === 'rehearsal' && data.data?.mustChangePassword) {
          setAccount({ email: data.data.email ?? '', name: data.data.name ?? '' })
          setState('setup')
          return
        }

        setState('allowed')
      })
      .catch(() => {
        router.replace('/admin/login')
      })

    return () => {
      mounted = false
    }
  }, [pathname, router])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted text-sm text-muted-foreground">
        관리자 권한을 확인하는 중입니다.
      </div>
    )
  }

  if (state === 'setup') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6">
          <h1 className="text-xl font-bold">처음 오셨네요</h1>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            연습일지를 쓰기 전에 이름과 새 비밀번호를 정해주세요. 처음 비밀번호는 누구나 짐작할 수 있어 꼭 바꿔야 합니다.
          </p>
          <AccountSetupForm
            isFirstLogin
            loginId={account.email}
            currentName={account.name}
            onDone={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  if (state === 'forbidden') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
        <h1 className="text-xl font-bold text-foreground">접근 권한이 없습니다</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          이 메뉴를 사용할 권한이 없습니다. 필요하시면 축제 사무국(관리자)에 권한을 요청해주세요.
        </p>
        <Link
          href={resolveGroupHomeHref(permissions)}
          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          내 관리 화면으로 이동
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
