'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { ArrowLeft } from 'lucide-react'
import { adminFetch } from '@/lib/admin-fetch'
import { useAdminAccount } from '@/lib/use-admin-account'
import { resolveRehearsalAbility, type RehearsalTeam } from '@/lib/rehearsal'

/** 연습일지 하위 화면(쓰기·보기·고치기)의 공통 틀: 사이드바 + 목록으로 돌아가기 */
export function RehearsalShell({
  backHref,
  children,
}: {
  backHref: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-muted print:block print:bg-white">
      {/* 인쇄할 때는 사이드바를 빼고 일지만 남긴다 */}
      <div className="print:hidden">
        <AdminSidebar />
      </div>
      <main className="flex-1 pt-14 lg:pt-0 print:pt-0">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground print:hidden"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />연습일지 목록
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}

/** 팀 목록과 로그인 계정의 연습일지 권한을 함께 읽는다. 둘 다 준비되면 ready가 true */
export function useRehearsalContext() {
  const me = useAdminAccount()
  const [teams, setTeams] = useState<RehearsalTeam[] | null>(null)

  useEffect(() => {
    adminFetch('/api/rehearsal-teams')
      .then((res) => res.json())
      .then((data) => setTeams(data.success ? data.data : []))
      .catch(() => setTeams([]))
  }, [])

  return {
    me,
    teams: teams ?? [],
    ability: resolveRehearsalAbility(me),
    ready: teams !== null && !!me.id,
  }
}
