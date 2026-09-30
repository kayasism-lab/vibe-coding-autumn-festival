'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { RehearsalLogComments } from '@/components/admin/rehearsal/log-comments'
import { RehearsalLogDocument } from '@/components/admin/rehearsal/log-document'
import { RehearsalShell, usePrintTitle, useRehearsalContext } from '@/components/admin/rehearsal/rehearsal-shell'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Pencil, Printer, Trash2 } from 'lucide-react'
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
  const [teamLogs, setTeamLogs] = useState<RehearsalLog[]>([])

  useEffect(() => {
    // 앞뒤 연습으로 넘어가면 같은 화면에서 id만 바뀐다. 이전 일지가 잠깐 남아 보이지 않게 비운다
    setLog(null)
    setError('')
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

  // 앞뒤 연습으로 넘기려고 같은 팀의 일지 목록(오래된 순)을 읽는다.
  // 못 읽어도 일지 보기는 그대로 되고, 넘기기 버튼만 나오지 않는다
  const teamId = log?.team
  useEffect(() => {
    if (!teamId) return
    adminFetch(`/api/rehearsal-logs?team=${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTeamLogs(data.data)
      })
      .catch(() => {})
  }, [teamId])

  const position = teamLogs.findIndex((item) => item._id === log?._id)
  const previousLog = position > 0 ? teamLogs[position - 1] : null
  const nextLog = position >= 0 && position < teamLogs.length - 1 ? teamLogs[position + 1] : null

  const canEdit = ready && !!log && canWriteTeam(ability, log.team)
  const editHref = `/admin/rehearsal-logs/${log?._id ?? ''}/edit`

  const backHref = log ? `/admin/rehearsal-logs?team=${log.team}` : '/admin/rehearsal-logs'
  // PDF로 저장할 때 파일 이름: '팀명 #차수'
  usePrintTitle(log ? `${log.teamInfo?.name ?? '연습일지'} #${log.sessionNo}` : '')

  return (
    <RehearsalShell backHref={backHref}>
      {error ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">{error}</p>
      ) : !log ? (
        <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
      ) : (
        <>
          {/* 인쇄할 때는 버튼 줄을 뺀다.
              휴대폰에서는 버튼을 같은 폭으로 늘려 한 줄에 담는다(글자도 짧게) */}
          <div className="mb-4 flex gap-2 print:hidden sm:flex-wrap sm:justify-end max-sm:[&>*]:h-11 max-sm:[&>*]:flex-1">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              <span className="sm:hidden">PDF 저장</span>
              <span className="hidden sm:inline">인쇄 · PDF 저장</span>
            </Button>
            {canEdit && (
              <Button asChild>
                <Link href={editHref}>
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

          {/* 목록으로 돌아가지 않고 앞뒤 연습으로 넘긴다. 긴 일지를 다 읽은 자리에서 바로 고칠 수도 있게
              가운데에 고치기를 한 번 더 둔다 */}
          {(previousLog || nextLog || canEdit) && (
            <nav aria-label="다른 연습일지" className="mt-4 grid grid-cols-3 gap-2 print:hidden">
              {previousLog ? (
                <Button asChild variant="outline" className="h-11 justify-start px-3">
                  <Link href={`/admin/rehearsal-logs/${previousLog._id}`}>
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="truncate">#{previousLog.sessionNo} 이전</span>
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {canEdit ? (
                <Button asChild variant="outline" className="h-11">
                  <Link href={editHref}>
                    <Pencil className="mr-1.5 h-4 w-4" />고치기
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {nextLog ? (
                <Button asChild variant="outline" className="h-11 justify-end px-3">
                  <Link href={`/admin/rehearsal-logs/${nextLog._id}`}>
                    <span className="truncate">다음 #{nextLog.sessionNo}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
          {/* 댓글은 모든 팀 일지에 달 수 있고, 인쇄·PDF에도 함께 실린다.
              계정 정보가 준비된 뒤에 그려야 본인 댓글을 가려낸다 */}
          {ready && <RehearsalLogComments logId={log._id} myId={me.id} canDeleteAny={ability.canDelete} />}
        </>
      )}
    </RehearsalShell>
  )
}
