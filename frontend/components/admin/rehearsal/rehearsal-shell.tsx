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
      <main className="min-w-0 flex-1 pt-14 lg:pt-0 print:pt-0">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
          <Link
            href={backHref}
            // -my-1 py-2: 글자 크기는 그대로 두고 누르는 칸만 키운다
            className="-my-1 mb-3 inline-flex items-center py-2 text-sm text-muted-foreground hover:text-foreground print:hidden"
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

/**
 * 화면이 열려 있는 동안 브라우저 탭 제목을 바꾼다.
 * 인쇄 창에서 'PDF로 저장'을 고르면 이 제목이 파일 이름이 되므로 '팀명 #차수'를 넣는다.
 * 버튼 대신 Ctrl+P로 인쇄해도 같은 이름이 나오도록 인쇄 순간이 아니라 화면 전체에 걸어 둔다.
 * 화면을 떠나면 원래 제목으로 되돌린다
 */
export function usePrintTitle(title: string) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
