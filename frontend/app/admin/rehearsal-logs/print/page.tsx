'use client'

import { useEffect, useState } from 'react'
import { formatCommentTime } from '@/components/admin/rehearsal/log-comments'
import { RehearsalLogDocument } from '@/components/admin/rehearsal/log-document'
import { RehearsalShell, useRehearsalContext } from '@/components/admin/rehearsal/rehearsal-shell'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import type { RehearsalComment, RehearsalLog } from '@/lib/rehearsal'

type LogWithComments = RehearsalLog & { comments: RehearsalComment[] }

/**
 * 한 팀의 연습일지 전체를 한 번에 인쇄(PDF 저장)하는 화면.
 * 1번째 연습부터 차례로, 일지 한 건마다 새 쪽에서 시작하고 아래에 댓글을 싣는다
 */
export default function RehearsalLogsPrintPage() {
  const { teams, ready } = useRehearsalContext()
  // 주소의 ?team= 값. 화면이 브라우저에서 열린 뒤에 읽는다 (새 일지 쓰기 화면과 같은 방식)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogWithComments[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setTeamId(new URLSearchParams(window.location.search).get('team') ?? '')
  }, [])

  useEffect(() => {
    if (teamId === null) return
    if (!teamId) {
      setError('팀을 고른 뒤 다시 열어주세요.')
      return
    }

    const load = async () => {
      const res = await adminFetch(`/api/rehearsal-logs?team=${teamId}`)
      if (!res.ok) {
        setError(await getErrorMessage(res))
        return
      }
      const list: RehearsalLog[] = (await res.json()).data
      // 댓글은 일지마다 따로 읽는다. 한 팀이 수십 건 수준이라 한꺼번에 요청해도 가볍다.
      // 댓글을 못 읽은 일지는 댓글 없이라도 인쇄되도록 빈 목록으로 둔다
      const withComments = await Promise.all(
        list.map(async (log) => {
          try {
            const commentRes = await adminFetch(`/api/rehearsal-logs/${log._id}/comments`)
            const comments = commentRes.ok ? (await commentRes.json()).data : []
            return { ...log, comments }
          } catch {
            return { ...log, comments: [] }
          }
        })
      )
      setLogs(withComments)
    }
    load().catch(() => setError('연습일지를 불러오지 못했습니다.'))
  }, [teamId])

  const team = teams.find((item) => item._id === teamId) ?? null
  const backHref = teamId ? `/admin/rehearsal-logs?team=${teamId}` : '/admin/rehearsal-logs'

  return (
    <RehearsalShell backHref={backHref}>
      {error ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">{error}</p>
      ) : !logs || !ready ? (
        <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
      ) : logs.length === 0 ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">아직 쓴 연습일지가 없습니다.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <p className="text-sm text-muted-foreground">
              {team?.name} 연습일지 {logs.length}건 · 일지 한 건마다 새 쪽에서 시작합니다
            </p>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />인쇄 · PDF 저장
            </Button>
          </div>

          <div className="space-y-6 print:space-y-0">
            {logs.map((log, index) => (
              // 두 번째 일지부터는 인쇄할 때 새 쪽에서 시작한다
              <div key={log._id} style={index > 0 ? { breakBefore: 'page' } : undefined}>
                <RehearsalLogDocument log={log} team={team} />
                {log.comments.length > 0 && (
                  <section className="mt-3 rounded-xl border bg-card p-4 print:mt-4 print:rounded-none print:border-0 print:border-t print:p-0 print:pt-3">
                    <h2 className="mb-1 text-sm font-bold text-muted-foreground">댓글 {log.comments.length}</h2>
                    <ul className="divide-y">
                      {log.comments.map((comment) => (
                        <li key={comment._id} className="break-inside-avoid py-2">
                          <p className="text-sm">
                            <span className="font-semibold">{comment.authorName || '이름 없음'}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{formatCommentTime(comment.createdAt)}</span>
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </RehearsalShell>
  )
}
