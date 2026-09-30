'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { RehearsalLogComments } from '@/components/admin/rehearsal/log-comments'
import { RehearsalLogDocument } from '@/components/admin/rehearsal/log-document'
import { RehearsalShell, useRehearsalContext } from '@/components/admin/rehearsal/rehearsal-shell'
import { Button } from '@/components/ui/button'
import { Pencil, Printer, Trash2 } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { canWriteTeam, type RehearsalLog, type RehearsalTeam } from '@/lib/rehearsal'

type LogDetail = RehearsalLog & { teamInfo: RehearsalTeam | null }

// 연습일지 한 건 보기. 여기서 고치기·인쇄(PDF 저장)·삭제(관리자만)를 한다
export default function RehearsalLogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { me, ability, ready } = useRehearsalContext()
  const [log, setLog] = useState<LogDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch(`/api/rehearsal-logs/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(await getErrorMessage(res))
          return
        }
        const data = await res.json()
        setLog(data.data)
      })
      .catch(() => setError('연습일지를 불러오지 못했습니다.'))
  }, [id])

  const handleDelete = async () => {
    if (!log || !confirm(`#${log.sessionNo}번째 연습일지를 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return
    const res = await adminFetch(`/api/rehearsal-logs/${log._id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push(`/admin/rehearsal-logs?team=${log.team}`)
      return
    }
    alert(await getErrorMessage(res))
  }

  const backHref = log ? `/admin/rehearsal-logs?team=${log.team}` : '/admin/rehearsal-logs'

  return (
    <RehearsalShell backHref={backHref}>
      {error ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">{error}</p>
      ) : !log ? (
        <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
      ) : (
        <>
          {/* 인쇄할 때는 버튼 줄을 뺀다 */}
          <div className="mb-4 flex flex-wrap justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />인쇄 · PDF 저장
            </Button>
            {ready && canWriteTeam(ability, log.team) && (
              <Button asChild>
                <Link href={`/admin/rehearsal-logs/${log._id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />고치기
                </Link>
              </Button>
            )}
            {ready && ability.canDelete && (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />삭제
              </Button>
            )}
          </div>
          <RehearsalLogDocument log={log} team={log.teamInfo} />
          {/* 댓글은 모든 팀 일지에 달 수 있고, 인쇄·PDF에도 함께 실린다.
              계정 정보가 준비된 뒤에 그려야 본인 댓글을 가려낸다 */}
          {ready && <RehearsalLogComments logId={log._id} myId={me.id} canDeleteAny={ability.canDelete} />}
        </>
      )}
    </RehearsalShell>
  )
}
