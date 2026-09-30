'use client'

import { useMemo } from 'react'
import { RehearsalLogForm } from '@/components/admin/rehearsal/log-form'
import { RehearsalShell, useRehearsalContext } from '@/components/admin/rehearsal/rehearsal-shell'
import { canWriteTeam, defaultLogTimes, todayString, type RehearsalLogDraft } from '@/lib/rehearsal'

// 연습일지 새로 쓰기
export default function NewRehearsalLogPage() {
  const { teams, ability, ready } = useRehearsalContext()

  // 처음 고를 팀: 주소의 ?team= → 내 담당 팀 → 쓸 수 있는 첫 팀
  const initial = useMemo<RehearsalLogDraft | null>(() => {
    if (!ready) return null
    const fromQuery = new URLSearchParams(window.location.search).get('team')
    const writable = teams.filter((team) => canWriteTeam(ability, team._id))
    const team = writable.find((item) => item._id === fromQuery) ?? writable[0]
    return {
      team: team?._id ?? '',
      date: todayString(),
      // 평소 연습 시간을 기본값으로 채워 둔다(단막극 8시~10시 반, 낭독극 8시~10시). 다른 시간이면 고쳐 쓰면 된다
      ...defaultLogTimes(team),
      attendees: [],
      topic: '',
      content: '',
      directorComment: '',
      photos: [],
      files: [],
    }
    // ability는 그릴 때마다 새로 만들어지는 객체라, 실제로 바뀌는 값(쓸 수 있는 팀)만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, teams, ability.writableTeamId])

  const backHref = initial?.team ? `/admin/rehearsal-logs?team=${initial.team}` : '/admin/rehearsal-logs'

  return (
    <RehearsalShell backHref={backHref}>
      <h1 className="mb-4 text-2xl font-bold">연습일지 쓰기</h1>
      {!initial ? (
        <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
      ) : !initial.team ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
          일지를 쓸 수 있는 팀이 없습니다.
        </p>
      ) : (
        <RehearsalLogForm teams={teams} ability={ability} initial={initial} />
      )}
    </RehearsalShell>
  )
}
