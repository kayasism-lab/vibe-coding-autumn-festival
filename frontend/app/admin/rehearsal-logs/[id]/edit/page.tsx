'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { RehearsalLogForm } from '@/components/admin/rehearsal/log-form'
import { RehearsalShell, useRehearsalContext } from '@/components/admin/rehearsal/rehearsal-shell'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { canWriteTeam, type RehearsalLog } from '@/lib/rehearsal'

// 연습일지 고치기
export default function EditRehearsalLogPage() {
  const { id } = useParams<{ id: string }>()
  const { teams, ability, ready } = useRehearsalContext()
  const [log, setLog] = useState<RehearsalLog | null>(null)
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

  return (
    <RehearsalShell backHref={log ? `/admin/rehearsal-logs/${log._id}` : '/admin/rehearsal-logs'}>
      <h1 className="mb-4 text-2xl font-bold">연습일지 고치기</h1>
      {error ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">{error}</p>
      ) : !log || !ready ? (
        <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
      ) : !canWriteTeam(ability, log.team) ? (
        <p className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
          자기 팀의 연습일지만 고칠 수 있습니다.
        </p>
      ) : (
        <RehearsalLogForm
          teams={teams}
          ability={ability}
          editingLog={log}
          initial={{
            team: log.team,
            date: log.date,
            startTime: log.startTime,
            endTime: log.endTime,
            attendees: log.attendees,
            topic: log.topic,
            content: log.content,
            directorComment: log.directorComment,
            photos: log.photos,
            files: log.files ?? [],
          }}
        />
      )}
    </RehearsalShell>
  )
}
