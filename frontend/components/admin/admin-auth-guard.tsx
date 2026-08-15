'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type MeResponse = {
  success: boolean
  data?: {
    role: 'superadmin' | 'admin' | 'group' | 'normal'
  }
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAllowed(true)
      return
    }

    let mounted = true

    fetch('/api/auth/me')
      .then((res) => res.json() as Promise<MeResponse>)
      .then((data) => {
        if (!mounted) return
        const role = data.data?.role
        if (data.success && (role === 'superadmin' || role === 'admin' || role === 'group')) {
          setIsAllowed(true)
          return
        }

        router.replace('/admin/login')
      })
      .catch(() => {
        router.replace('/admin/login')
      })

    return () => {
      mounted = false
    }
  }, [pathname, router])

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted text-sm text-muted-foreground">
        관리자 권한을 확인하는 중입니다.
      </div>
    )
  }

  return <>{children}</>
}
