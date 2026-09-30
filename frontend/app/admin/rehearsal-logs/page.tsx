'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Camera, MessageSquareQuote, Plus, Printer, Users } from 'lucide-react'
import { adminFetch } from '@/lib/admin-fetch'
import { useAdminAccount } from '@/lib/use-admin-account'
import {
  canWriteTeam,
  formatLogDate,
  formatLogTime,
  formatTeamLeaders,
  rehearsalLabels,
  resolveRehearsalAbility,
  type RehearsalLog,
  type RehearsalTeam,
} from '@/lib/rehearsal'
import { cn } from '@/lib/utils'

// 연습일지 목록(열린 단막극·열린 낭독극). 팀을 고르면 그 팀 일지를 최신순으로 보여준다
export default function AdminRehearsalLogsPage() {
  const me = useAdminAccount()
  const ability = resolveRehearsalAbility(me)
  const [teams, setTeams] = useState<RehearsalTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [logs, setLogs] = useState<RehearsalLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/rehearsal-teams')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTeams(data.data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // 처음 고를 팀: 주소의 ?team= → 내 담당 팀 → 첫 팀 순서.
  // useSearchParams는 Suspense 경계가 필요해 주소를 직접 읽는다
  useEffect(() => {
    if (selectedTeamId || teams.length === 0 || !me.id) return
    const fromQuery = new URLSearchParams(window.location.search).get('team')
    const candidates = [fromQuery, me.rehearsalTeam, teams[0]._id]
    const initial = candidates.find((id) => id && teams.some((team) => team._id === id))
    if (initial) setSelectedTeamId(initial)
  }, [teams, me.id, me.rehearsalTeam, selectedTeamId])

  const fetchLogs = useCallback(async (teamId: string) => {
    const res = await adminFetch(`/api/rehearsal-logs?team=${teamId}`)
    const data = await res.json()
    if (data.success) setLogs(data.data)
  }, [])

  useEffect(() => {
    if (!selectedTeamId) return
    fetchLogs(selectedTeamId).catch(() => {})
    // 새로고침해도 같은 팀이 보이도록 주소에 남긴다
    window.history.replaceState(null, '', `/admin/rehearsal-logs?team=${selectedTeamId}`)
  }, [selectedTeamId, fetchLogs])

  const selectedTeam = teams.find((team) => team._id === selectedTeamId)
  const labels = rehearsalLabels(selectedTeam)
  // 관리자는 단막극·낭독극 팀을 함께 본다. 그때만 팀 버튼에 종류를 붙여 구분한다
  const hasBothKinds = new Set(teams.map((team) => team.kind)).size > 1
  // 머리글 설명: 고른 팀의 종류를 따르고, 아직 팀이 없으면 두 종류를 아우르는 문구를 쓴다
  const subtitle = !selectedTeam ? '팀별 연습 기록' : selectedTeam.kind === 'reading' ? '열린 낭독극 연습 기록' : `${labels.program} 팀별 연습 기록`
  // 최신 연습이 위로 오게 뒤집는다 (서버는 번호를 매기려고 오래된 순으로 준다)
  const newestFirst = useMemo(() => [...logs].reverse(), [logs])
  const totalMinutes = useMemo(() => logs.reduce((sum, log) => sum + durationMinutes(log), 0), [logs])

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">연습일지</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {selectedTeam && canWriteTeam(ability, selectedTeam._id) && (
              <Button asChild>
                <Link href={`/admin/rehearsal-logs/new?team=${selectedTeam._id}`}>
                  <Plus className="mr-2 h-4 w-4" />연습일지 쓰기
                </Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
          ) : teams.length === 0 ? (
            <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
              아직 등록된 팀이 없습니다.
              {ability.canManageTeams && (
                <> <Link href="/admin/rehearsal-teams" className="font-medium text-primary underline">연습일지 설정</Link>에서 팀을 만들어주세요.</>
              )}
            </div>
          ) : (
            <>
              {/* 팀 고르기. 글자가 큰 버튼으로 둬 휴대폰에서도 누르기 쉽게 한다 */}
              <div className="mb-4 flex flex-wrap gap-2">
                {teams.map((team) => (
                  <button
                    key={team._id}
                    type="button"
                    onClick={() => setSelectedTeamId(team._id)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      team._id === selectedTeamId
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {hasBothKinds && team.kind !== 'reading' && <span className="mr-1 text-xs opacity-80">[{rehearsalLabels(team).program.replace('열린 ', '')}]</span>}
                    {team.name}
                    {team._id === me.rehearsalTeam && <span className="ml-1 text-xs opacity-80">(내 팀)</span>}
                  </button>
                ))}
              </div>

              {selectedTeam && (
                <div className="mb-5 rounded-xl border bg-card p-4 text-sm">
                  <p className="text-base font-bold">{selectedTeam.title}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatTeamLeaders(selectedTeam)}
                    {` · ${labels.member} ${selectedTeam.members.length}명`}
                  </p>
                  <p className="mt-2 font-medium">
                    지금까지 {logs.length}번 연습
                    {totalMinutes > 0 && ` · 총 ${formatDuration(totalMinutes)}`}
                  </p>
                </div>
              )}

              {newestFirst.length === 0 ? (
                <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
                  아직 쓴 연습일지가 없습니다.
                </div>
              ) : (
                <ul className="space-y-3">
                  {newestFirst.map((log) => (
                    <li key={log._id}>
                      <Link
                        href={`/admin/rehearsal-logs/${log._id}`}
                        className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-lg font-bold text-primary">#{log.sessionNo}번째 연습</span>
                          <span className="text-sm font-medium">{formatLogDate(log.date)}</span>
                          <span className="text-sm text-muted-foreground">{formatLogTime(log.startTime, log.endTime)}</span>
                        </div>
                        {log.topic && <p className="mt-1.5 font-medium">{log.topic}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                          <Badge variant="outline" className="font-normal">
                            <Users className="mr-1 h-3 w-3" />출석 {log.attendees.length}/{log.roster.length}
                          </Badge>
                          {log.photos.length > 0 && (
                            <Badge variant="outline" className="font-normal">
                              <Camera className="mr-1 h-3 w-3" />사진 {log.photos.length}
                            </Badge>
                          )}
                          {log.directorComment && (
                            <Badge variant="secondary" className="font-normal">
                              <MessageSquareQuote className="mr-1 h-3 w-3" />{labels.comment}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {selectedTeam && logs.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Printer className="h-3.5 w-3.5" />
                    일지를 열고 &lsquo;인쇄 · PDF 저장&rsquo;을 누르면 A4 한 장으로 뽑을 수 있습니다.
                  </p>
                  {/* 팀 일지 전체를 댓글까지 한 번에 PDF로 뽑는 화면 */}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/rehearsal-logs/print?team=${selectedTeam._id}`}>
                      <Printer className="mr-2 h-4 w-4" />이 팀 일지 전체 PDF
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function durationMinutes(log: RehearsalLog) {
  if (!log.startTime || !log.endTime) return 0
  const [sh, sm] = log.startTime.split(':').map(Number)
  const [eh, em] = log.endTime.split(':').map(Number)
  return Math.max(0, eh * 60 + em - (sh * 60 + sm))
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? `${hours}시간` : '', rest ? `${rest}분` : ''].filter(Boolean).join(' ')
}
