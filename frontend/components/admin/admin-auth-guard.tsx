'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { canGroupAccessPath, type GroupPermission } from '@/lib/admin-permissions'
import { refreshSession } from '@/lib/admin-fetch'

/**
 * 세션을 이어주는 간격.
 * 로그인 토큰이 15분이라 그 전에 미리 늘려둔다. 관리 화면을 열어두고 작업하는
 * 동안에는 저절로 유지되고, 창을 닫으면 더 이상 늘어나지 않는다.
 */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000

type MeResponse = {
  success: boolean
  data?: {
    role: 'superadmin' | 'admin' | 'group' | 'normal'
    permissions?: GroupPermission[]
  }
}

type GuardState = 'checking' | 'allowed' | 'forbidden'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<GuardState>('checking')

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

        if (!data.success || (role !== 'superadmin' && role !== 'admin' && role !== 'group')) {
          router.replace('/admin/login')
          return
        }

        // 극단 담당자는 권한이 있는 메뉴에만 들어갈 수 있다.
        // 주소를 직접 입력해 들어와도 여기서 막는다.
        if (role === 'group' && !canGroupAccessPath(pathname, data.data?.permissions ?? [])) {
          setState('forbidden')
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

  // 관리 화면에 머무는 동안 로그인이 풀리지 않게 주기적으로 세션을 연장한다.
  // 화면 이동과 무관하게 한 번만 걸어두면 되므로 의존성을 비워 둔다
  useEffect(() => {
    const timer = setInterval(() => {
      void refreshSession()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted text-sm text-muted-foreground">
        관리자 권한을 확인하는 중입니다.
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
          href="/admin/my-group"
          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          내 극단 관리로 이동
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
