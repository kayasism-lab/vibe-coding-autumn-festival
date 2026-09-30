'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Camera, ChevronRight, MessageSquareQuote, Plus, Printer, Users } from 'lucide-react'
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
  const canWriteSelected = !!selectedTeam && canWriteTeam(ability, selectedTeam._id)
  const writeHref = `/admin/rehearsal-logs/new?team=${selectedTeam?._id ?? ''}`

  // 휴대폰에서는 팀 버튼이 가로로 밀리는 한 줄이라, 고른 팀이 화면 밖에 있으면 보이는 곳으로 끌어온다
  const selectedChipRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    selectedChipRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [selectedTeamId])

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">연습일지</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {/* 넓은 화면에서는 머리글 옆, 휴대폰에서는 아래에 떠 있는 버튼으로 둔다 */}
            {canWriteSelected && (
              <Button asChild className="hidden sm:inline-flex">
                <Link href={writeHref}>
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
              {/* 팀 고르기. 글자가 큰 버튼으로 둬 휴대폰에서도 누르기 쉽게 한다.
                  휴대폰에서는 여러 줄로 접히면 목록이 아래로 밀리므로 한 줄로 두고 옆으로 민다
                  (-mx-4 px-4: 화면 끝까지 밀리도록 바깥 여백을 상쇄) */}
              <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {teams.map((team) => (
                  <button
                    key={team._id}
                    ref={team._id === selectedTeamId ? selectedChipRef : undefined}
                    type="button"
                    onClick={() => setSelectedTeamId(team._id)}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-colors sm:py-2',
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
                        className="relative block rounded-xl border bg-card p-4 pr-9 transition-colors hover:border-primary/50 active:bg-muted/60"
                      >
                        {/* 누르면 열린다는 표시 */}
                        <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-lg font-bold text-primary">#{log.sessionNo}번째 연습</span>
                          <span className="text-sm font-medium">{formatLogDate(log.date)}</span>
                          <span className="text-sm text-muted-foreground">{formatLogTime(log.startTime, log.endTime)}</span>
                        </div>
                        {log.topic && <p className="mt-1.5 font-medium">{log.topic}</p>}
                        {/* 열어보지 않아도 어떤 연습이었는지 알 수 있게 내용 앞부분을 두 줄만 보여준다 */}
                        {log.content && (
                          <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{log.content}</p>
                        )}
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
                // 휴대폰에서는 아래 떠 있는 '쓰기' 버튼에 가리지 않게 여백을 더 둔다
                <div className={cn('mt-6 flex flex-wrap items-center justify-between gap-3', canWriteSelected && 'pb-16 sm:pb-0')}>
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Printer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    일지를 열고 &lsquo;인쇄 · PDF 저장&rsquo;을 누르면 A4 한 장으로 뽑을 수 있습니다.
                  </p>
                  {/* 팀 일지 전체를 댓글까지 한 번에 PDF로 뽑는 화면 */}
                  <Button asChild variant="outline" size="sm" className="h-10 w-full sm:h-8 sm:w-auto">
                    <Link href={`/admin/rehearsal-logs/print?team=${selectedTeam._id}`}>
                      <Printer className="mr-2 h-4 w-4" />이 팀 일지 전체 PDF
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 휴대폰용 떠 있는 '쓰기' 버튼. 목록을 아무리 내려도 바로 쓸 수 있다.
            아래 탭 막대가 있으면 그 위에 오도록 막대 높이(globals.css의 변수)만큼 올린다 */}
        {canWriteSelected && (
          <Button
            asChild
            size="lg"
            className="fixed right-4 bottom-[calc(var(--admin-tabbar-height,env(safe-area-inset-bottom))+1rem)] z-30 h-12 rounded-full px-5 text-base shadow-lg sm:hidden"
          >
            <Link href={writeHref}>
              <Plus className="mr-1 h-5 w-5" />연습일지 쓰기
            </Link>
          </Button>
        )}
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
