'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RotateCcw, UserPlus } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import type { RehearsalTeam } from '@/lib/rehearsal'

// 백엔드 routes/rehearsal-accounts.ts의 REHEARSAL_ID_PREFIX와 같은 값
const ID_PREFIX = 'jik_short_'

interface Account {
  _id: string
  email: string
  name: string
  mustChangePassword?: boolean
  lastLoginAt?: string
}

interface Props {
  team: RehearsalTeam | null
  /** 다른 팀이 이미 쓰는 번호. 새 번호를 제안할 때 피한다 */
  usedSeries: number[]
  onOpenChange: (open: boolean) => void
  /** 팀 번호가 정해지면 팀 목록을 다시 읽도록 알린다 */
  onChanged: () => void
}

/** 팀원 계정 일괄 만들기·목록·비밀번호 초기화 (관리자 전용) */
export function TeamAccountsDialog({ team, usedSeries, onOpenChange, onChanged }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [series, setSeries] = useState(1)
  const [count, setCount] = useState(10)
  const [message, setMessage] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  const fetchAccounts = useCallback(async (teamId: string) => {
    const res = await adminFetch(`/api/rehearsal-accounts?team=${teamId}`)
    const data = await res.json()
    if (data.success) setAccounts(data.data)
  }, [])

  // 창을 연 팀이 바뀔 때만 초기화한다. 팀 목록을 다시 읽어 team 객체만 새로 바뀐 경우까지
  // 초기화하면 방금 띄운 '몇 개 만들었습니다' 안내가 바로 지워진다
  const teamId = team?._id
  useEffect(() => {
    if (!team) return
    setMessage('')
    setAccounts([])
    // 이미 번호가 있으면 그대로, 없으면 아직 안 쓴 가장 작은 번호를 제안한다
    setSeries(team.accountSeries ?? ([1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => !usedSeries.includes(n)) ?? 1))
    fetchAccounts(team._id).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, fetchAccounts])

  const handleCreate = async () => {
    if (!team) return
    setIsWorking(true)
    setMessage('')
    try {
      const res = await adminFetch('/api/rehearsal-accounts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: team._id, series, count }),
      })
      if (!res.ok) {
        setMessage(await getErrorMessage(res))
        return
      }
      const data = await res.json()
      const { created, skipped } = data.data as { created: string[]; skipped: string[] }
      setMessage(`${created.length}개를 만들었습니다.${skipped.length ? ` (이미 있는 ${skipped.length}개는 건너뜀)` : ''}`)
      await fetchAccounts(team._id)
      onChanged()
    } finally {
      setIsWorking(false)
    }
  }

  const handleReset = async (account: Account) => {
    if (!confirm(`${account.name}(${account.email})의 비밀번호를 아이디와 같게 되돌릴까요?\n다음 로그인 때 새 비밀번호를 정하게 됩니다.`)) return
    const res = await adminFetch(`/api/rehearsal-accounts/${account._id}/reset`, { method: 'POST' })
    if (!res.ok) {
      alert(await getErrorMessage(res))
      return
    }
    if (team) await fetchAccounts(team._id)
  }

  const firstId = `${ID_PREFIX}${series * 1000 + 1}`
  const lastId = `${ID_PREFIX}${series * 1000 + count}`

  return (
    <Dialog open={!!team} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>팀원 계정 · {team?.name}</DialogTitle>
          <DialogDescription>처음 비밀번호는 아이디와 같고, 첫 로그인 때 이름과 새 비밀번호를 정하게 됩니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>팀 번호</Label>
              <Input
                type="number"
                min={1}
                max={9}
                value={series}
                // 한 번 정한 번호를 바꾸면 기존 계정과 아이디 규칙이 어긋나므로 잠근다
                disabled={team?.accountSeries !== undefined}
                onChange={(e) => setSeries(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>계정 수</Label>
              <Input type="number" min={1} max={99} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {firstId} ~ {lastId}. 이미 있는 아이디는 건너뛰니, 모자라면 계정 수를 늘려 다시 누르면 됩니다.
          </p>
          <Button onClick={handleCreate} disabled={isWorking} className="w-full">
            {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            계정 만들기
          </Button>
          {message && <p className="text-sm font-medium">{message}</p>}
        </div>

        <ul className="divide-y rounded-lg border">
          {accounts.length === 0 ? (
            <li className="p-4 text-center text-sm text-muted-foreground">아직 만든 계정이 없습니다.</li>
          ) : (
            accounts.map((account) => (
              <li key={account._id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="w-44 shrink-0 font-mono text-xs">{account.email}</span>
                <span className="flex-1 truncate">
                  {account.mustChangePassword ? (
                    <Badge variant="outline" className="font-normal text-muted-foreground">첫 로그인 전</Badge>
                  ) : (
                    account.name
                  )}
                </span>
                <Button variant="ghost" size="icon" title="비밀번호 초기화" onClick={() => handleReset(account)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
