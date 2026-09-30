'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { AttendanceCheck } from '@/components/admin/rehearsal/attendance-check'
import { LogFilesUpload } from '@/components/admin/rehearsal/log-files'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageSquareQuote } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import {
  canWriteTeam,
  clearDraft,
  defaultLogTimes,
  loadDraft,
  previewSessionNo,
  rehearsalLabels,
  saveDraft,
  type RehearsalAbility,
  type RehearsalLog,
  type RehearsalLogDraft,
  type RehearsalTeam,
} from '@/lib/rehearsal'

interface Props {
  teams: RehearsalTeam[]
  ability: RehearsalAbility
  initial: RehearsalLogDraft
  /** 고치는 중인 일지. 없으면 새로 쓰는 중이다 */
  editingLog?: RehearsalLog
}

/**
 * 연습일지 쓰기·고치기 화면.
 * 순서: 팀 → 번호 → 연출 코멘트(위) → 날짜·시간 → 출석 → 주제·내용 → 사진(아래)
 */
export function RehearsalLogForm({ teams, ability, initial, editingLog }: Props) {
  const router = useRouter()
  const draftKey = editingLog ? `edit:${editingLog._id}` : 'new'
  const [form, setForm] = useState<RehearsalLogDraft>(initial)
  const [teamLogs, setTeamLogs] = useState<RehearsalLog[]>([])
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  // 사용자가 무언가 바꾼 뒤에만 임시 저장한다 (열어보기만 해도 저장되면 불러오기 안내가 괜히 뜬다)
  const isDirty = useRef(false)

  // 저장하지 못한 채 닫힌 작성 내용이 있으면 되살린다
  useEffect(() => {
    const draft = loadDraft(draftKey)
    if (draft && canWriteTeam(ability, draft.team)) {
      setForm(draft)
      setRestoredDraft(true)
    }
    // 처음 한 번만 확인한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isDirty.current) return
    const timer = setTimeout(() => saveDraft(draftKey, form), 500)
    return () => clearTimeout(timer)
  }, [form, draftKey])

  // 번호 미리보기에 필요한 같은 팀 일지 목록
  useEffect(() => {
    if (!form.team) return
    adminFetch(`/api/rehearsal-logs?team=${form.team}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTeamLogs(data.data)
      })
      .catch(() => {})
  }, [form.team])

  const update = (patch: Partial<RehearsalLogDraft>) => {
    isDirty.current = true
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const team = teams.find((item) => item._id === form.team)
  const labels = rehearsalLabels(team)
  // 고칠 때는 그 일지를 쓸 때의 명단을 쓴다 (비어 있으면 지금 팀원 명단)
  const roster = editingLog?.roster.length ? editingLog.roster : team?.members ?? []
  const sessionNo = form.date ? previewSessionNo(teamLogs, form.date, form.startTime, editingLog?._id) : null
  const writableTeams = teams.filter((item) => canWriteTeam(ability, item._id))

  const discardDraft = () => {
    clearDraft(draftKey)
    isDirty.current = false
    setForm(initial)
    setRestoredDraft(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.team) return setError('팀을 선택해주세요.')
    if (!form.date) return setError('연습 날짜를 선택해주세요.')
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      return setError('끝나는 시간이 시작 시간보다 늦어야 합니다.')
    }

    setIsSaving(true)
    setError('')
    try {
      const res = await adminFetch(editingLog ? `/api/rehearsal-logs/${editingLog._id}` : '/api/rehearsal-logs', {
        method: editingLog ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        // 실패해도 쓴 내용은 임시 저장에 남아 있다
        setError(await getErrorMessage(res))
        return
      }
      const data = await res.json()
      clearDraft(draftKey)
      router.push(`/admin/rehearsal-logs/${data.data._id}`)
    } catch {
      setError('저장 중 통신 문제가 생겼습니다. 쓴 내용은 이 기기에 남아 있으니 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-24">
      {restoredDraft && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>저장하지 않고 닫았던 작성 내용을 불러왔습니다.</span>
          <button type="button" className="font-medium underline" onClick={discardDraft}>
            버리고 처음부터 쓰기
          </button>
        </div>
      )}

      <Section>
        {editingLog ? (
          <p className="text-lg font-bold">{team?.name}</p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="team">팀</Label>
            <select
              id="team"
              className="h-11 w-full rounded-md border bg-background px-3 text-base"
              value={form.team}
              // 팀을 바꾸면 출석 명단이 달라지므로 출석 체크를 비운다
              onChange={(e) => {
                const nextTeam = teams.find((item) => item._id === e.target.value)
                const before = defaultLogTimes(team)
                // 시간을 손대지 않았으면(이전 팀의 기본값 그대로면) 새 팀 종류의 기본 시간으로 바꾼다.
                // 관리자가 단막극 팀과 낭독극 팀 사이를 오갈 때만 해당한다
                const untouched = form.startTime === before.startTime && form.endTime === before.endTime
                update({ team: e.target.value, attendees: [], ...(untouched ? defaultLogTimes(nextTeam) : {}) })
              }}
              disabled={writableTeams.length <= 1}
            >
              <option value="">팀을 선택하세요</option>
              {writableTeams.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>
        )}
        {team && (
          <dl className="mt-3 grid grid-cols-[4.5rem_1fr] gap-y-1 text-sm">
            {team.kind !== 'reading' && (<><dt className="text-muted-foreground">작품명</dt><dd className="font-medium">{team.title}</dd></>)}
            <dt className="text-muted-foreground">{labels.leader}</dt><dd>{team.director}</dd>
            {team.kind === 'reading'
              ? !!team.instructors?.length && (<><dt className="text-muted-foreground">강사</dt><dd>{team.instructors.join(', ')}</dd></>)
              : team.assistantDirector && (<><dt className="text-muted-foreground">조연출</dt><dd>{team.assistantDirector}</dd></>)}
          </dl>
        )}
        {sessionNo !== null && team && (
          <p className="mt-4 text-2xl font-bold text-primary">#{sessionNo}번째 연습</p>
        )}
      </Section>

      {/* 연출 코멘트(낭독극은 강사 코멘트)는 위쪽에 둔다. 단막극은 담당 계정만, 낭독극은 강사 계정도 쓴다.
          쓸 수 없는 계정에는 읽기로만 보인다 */}
      {(ability.canComment || form.directorComment) && (
        <Section title={labels.comment} icon={<MessageSquareQuote className="h-4 w-4" />}>
          {ability.canComment ? (
            <Textarea
              rows={4}
              placeholder={labels.commentHint}
              value={form.directorComment}
              onChange={(e) => update({ directorComment: e.target.value })}
            />
          ) : (
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{form.directorComment}</p>
          )}
        </Section>
      )}

      <Section title="날짜 · 시간">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input type="date" className="h-11 text-base" value={form.date} onChange={(e) => update({ date: e.target.value })} required />
          <div className="flex items-center gap-2">
            <Input type="time" className="h-11 text-base" aria-label="시작 시간" value={form.startTime} onChange={(e) => update({ startTime: e.target.value })} />
            <span className="text-muted-foreground">~</span>
            <Input type="time" className="h-11 text-base" aria-label="끝나는 시간" value={form.endTime} onChange={(e) => update({ endTime: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section title="출석 체크">
        <AttendanceCheck roster={roster} attendees={form.attendees} onChange={(attendees) => update({ attendees })} />
      </Section>

      <Section title="연습 내용">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="topic">연습 주제</Label>
            <Input id="topic" className="h-11 text-base" placeholder="예: 2장 동선 맞추기" value={form.topic} onChange={(e) => update({ topic: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">연습 내용</Label>
            <Textarea id="content" rows={10} className="text-base" placeholder={team?.kind === 'reading' ? '오늘 연습 내용, 느낀 점, 기타 연습 관련 내용' : '오늘 연습 내용, 연출님의 지적사항, 느낀 점, 기타 연습 관련 내용'} value={form.content} onChange={(e) => update({ content: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section title="사진">
        <CloudinaryUpload
          value={form.photos}
          onChange={(urls) => update({ photos: Array.isArray(urls) ? urls : [urls].filter(Boolean) })}
          multiple
          maxFiles={20}
          folder="autumn_festival/rehearsal"
          aspectRatio={4 / 3}
          aspectRatios={[]}
          placeholder="연습 사진 올리기"
        />
      </Section>

      <Section title="첨부 파일">
        <LogFilesUpload value={form.files ?? []} onChange={(files) => update({ files })} />
      </Section>

      {/* 휴대폰에서 긴 글을 쓴 뒤 맨 위로 올라가지 않고 저장할 수 있게 아래에 붙여 둔다 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
          {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
          <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingLog ? '고친 내용 저장' : '연습일지 저장'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Section({ title, icon, children }: { title?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      {title && (
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          {icon}
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
