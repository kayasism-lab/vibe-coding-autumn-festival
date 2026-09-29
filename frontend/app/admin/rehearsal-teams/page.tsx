'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { TeamFormDialog, emptyTeamForm, parseMembers, type TeamForm } from '@/components/admin/rehearsal/team-form-dialog'
import { TeamAccountsDialog } from '@/components/admin/rehearsal/team-accounts-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyRound, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { useAdminAccount } from '@/lib/use-admin-account'
import type { RehearsalTeam } from '@/lib/rehearsal'

// 열린 단막극 연습일지 설정 - 팀(작품명·팀명·연출·조연출·팀원) 만들기
export default function AdminRehearsalTeamsPage() {
  const me = useAdminAccount()
  // 팀 삭제는 총괄 관리자·관리자만 된다 (서버도 같은 규칙으로 막는다)
  const canDelete = me.role === 'superadmin' || me.role === 'admin'
  const [teams, setTeams] = useState<RehearsalTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTeam, setEditingTeam] = useState<RehearsalTeam | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<TeamForm>(emptyTeamForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  // 팀원 계정 창을 연 팀 (관리자만)
  const [accountsTeam, setAccountsTeam] = useState<RehearsalTeam | null>(null)

  const fetchTeams = useCallback(async () => {
    try {
      const res = await adminFetch('/api/rehearsal-teams')
      const data = await res.json()
      if (data.success) setTeams(data.data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const openDialog = (team?: RehearsalTeam) => {
    setErrorMessage('')
    setEditingTeam(team ?? null)
    setForm(
      team
        ? {
            title: team.title,
            name: team.name,
            director: team.director,
            assistantDirector: team.assistantDirector,
            membersText: team.members.join('\n'),
            order: team.order,
          }
        : { ...emptyTeamForm, order: teams.length + 1 }
    )
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.name.trim() || !form.director.trim()) {
      setErrorMessage('작품명, 팀명, 연출을 입력해주세요.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    try {
      const { membersText, ...rest } = form
      const res = await adminFetch(editingTeam ? `/api/rehearsal-teams/${editingTeam._id}` : '/api/rehearsal-teams', {
        method: editingTeam ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, members: parseMembers(membersText) }),
      })
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
        return
      }
      await fetchTeams()
      setIsDialogOpen(false)
    } catch {
      setErrorMessage('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (team: RehearsalTeam) => {
    if (!confirm(`'${team.name}' 팀을 삭제하시겠습니까?`)) return
    const res = await adminFetch(`/api/rehearsal-teams/${team._id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchTeams()
      return
    }
    alert(await getErrorMessage(res))
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">연습일지 설정</h1>
              <p className="text-muted-foreground">열린 단막극 팀별로 작품명·연출·팀원을 등록합니다.</p>
            </div>
            <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" />팀 추가</Button>
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-muted-foreground">불러오는 중...</p>
          ) : teams.length === 0 ? (
            <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
              아직 등록한 팀이 없습니다. <b>팀 추가</b>로 첫 팀을 만들어주세요.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <div key={team._id} className="flex flex-col rounded-xl border bg-card p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold">{team.name}</p>
                      <p className="text-sm text-muted-foreground">{team.title}</p>
                    </div>
                    <div className="flex">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(team)} title="수정">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(team)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex gap-2"><dt className="w-14 text-muted-foreground">연출</dt><dd>{team.director}</dd></div>
                    {team.assistantDirector && (
                      <div className="flex gap-2"><dt className="w-14 text-muted-foreground">조연출</dt><dd>{team.assistantDirector}</dd></div>
                    )}
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {team.members.length === 0 ? (
                      <span className="text-xs text-muted-foreground">등록된 팀원이 없습니다</span>
                    ) : (
                      team.members.map((member) => (
                        <Badge key={member} variant="outline" className="font-normal">{member}</Badge>
                      ))
                    )}
                  </div>
                  {team.accountSeries !== undefined && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      팀원 계정 jik_short_{team.accountSeries * 1000 + 1}~
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/rehearsal-logs?team=${team._id}`}>
                        <NotebookPen className="mr-2 h-4 w-4" />이 팀 연습일지 보기
                      </Link>
                    </Button>
                    {/* 계정 만들기는 사용자 관리와 같이 관리자 전용이다 */}
                    {canDelete && (
                      <Button variant="outline" size="sm" onClick={() => setAccountsTeam(team)}>
                        <KeyRound className="mr-2 h-4 w-4" />팀원 계정
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            팀원 계정은 팀 카드의 <b>팀원 계정</b>에서 한 번에 만듭니다(관리자). 한 명씩 만들려면 사용자 관리에서 계정 유형을 &lsquo;연습일지 작성자&rsquo;로 고르면 됩니다.
          </p>
        </div>
      </main>

      <TeamAccountsDialog
        // 계정을 만든 뒤 팀 목록을 다시 읽으면 팀 번호가 붙은 새 객체로 바꿔 끼운다 (번호 칸 잠금 반영)
        team={teams.find((team) => team._id === accountsTeam?._id) ?? null}
        usedSeries={teams
          .filter((team) => team._id !== accountsTeam?._id && team.accountSeries !== undefined)
          .map((team) => team.accountSeries as number)}
        onOpenChange={(open) => !open && setAccountsTeam(null)}
        onChanged={fetchTeams}
      />

      <TeamFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingTeam}
        form={form}
        setForm={setForm}
        errorMessage={errorMessage}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  )
}
