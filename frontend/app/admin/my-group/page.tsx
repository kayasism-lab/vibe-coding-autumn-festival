'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ExternalLink, Loader2, Save } from 'lucide-react'

interface TheaterGroup {
  _id: string
  name: string
  description: string
  founded?: string
  members?: string
  imageUrl?: string
  highlights: string[]
  socialLinks: {
    website?: string
    instagram?: string
    facebook?: string
    youtube?: string
    blog?: string
  }
}

interface Program {
  _id: string
  title: string
  venue: string
  ticketUrl?: string
}

export default function MyGroupPage() {
  const [group, setGroup] = useState<TheaterGroup | null>(null)
  const [highlightsText, setHighlightsText] = useState('')
  const [programs, setPrograms] = useState<Program[]>([])
  const [ticketUrls, setTicketUrls] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [savingProgramId, setSavingProgramId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const me = await fetch('/api/auth/me').then((r) => r.json())
    const name: string | undefined = me.data?.theaterGroupName

    const [groupsRes, programsRes] = await Promise.all([
      fetch('/api/theater-groups').then((r) => r.json()),
      fetch('/api/programs?active=false').then((r) => r.json()),
    ])

    if (groupsRes.success) {
      const mine = (groupsRes.data as TheaterGroup[]).find((g) => g.name === name)
      if (mine) {
        setGroup(mine)
        setHighlightsText(mine.highlights.join('\n'))
      }
    }

    if (programsRes.success) {
      const mine = (programsRes.data as (Program & { company: string })[]).filter(
        (p) => p.company === name
      )
      setPrograms(mine)
      setTicketUrls(Object.fromEntries(mine.map((p) => [p._id, p.ticketUrl || ''])))
    }

    setIsLoading(false)
  }

  function flash(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const saveGroup = async () => {
    if (!group) return
    setIsSavingGroup(true)
    const res = await fetch(`/api/theater-groups/${group._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...group,
        highlights: highlightsText.split('\n').filter((h) => h.trim()),
      }),
    })
    flash(res.ok ? '극단 정보가 저장되었습니다.' : '저장에 실패했습니다.')
    setIsSavingGroup(false)
  }

  const saveTicketUrl = async (programId: string) => {
    setSavingProgramId(programId)
    const res = await fetch(`/api/programs/${programId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketUrl: ticketUrls[programId] }),
    })
    flash(res.ok ? '예약 링크가 저장되었습니다.' : '저장에 실패했습니다.')
    setSavingProgramId(null)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-6 pt-20 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">내 극단 관리</h1>
            <p className="mt-1 text-muted-foreground">
              우리 극단 소개 정보와 공연 예약 링크를 직접 관리할 수 있습니다.
            </p>
          </div>

          {message && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          {!group ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                소속 극단 정보를 찾을 수 없습니다. 관리자에게 계정의 소속 극단명이 참여 극단 목록과
                일치하는지 확인을 요청해주세요.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>극단 소개 페이지에 표시되는 정보입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>대표 이미지</Label>
                    <CloudinaryUpload
                      value={group.imageUrl || ''}
                      onChange={(url) => setGroup({ ...group, imageUrl: url as string })}
                      folder={`autumn_festival/theater-groups/${group.name}`}
                      placeholder="극단 대표 이미지 업로드 (권장: 16:9)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="founded">창단년도</Label>
                      <Input
                        id="founded"
                        value={group.founded || ''}
                        onChange={(e) => setGroup({ ...group, founded: e.target.value })}
                        placeholder="예: 2005년"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="members">단원 수</Label>
                      <Input
                        id="members"
                        value={group.members || ''}
                        onChange={(e) => setGroup({ ...group, members: e.target.value })}
                        placeholder="예: 20명"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">극단 소개</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={group.description}
                      onChange={(e) => setGroup({ ...group, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="highlights">주요 활동 (줄바꿈으로 구분)</Label>
                    <Textarea
                      id="highlights"
                      rows={3}
                      value={highlightsText}
                      onChange={(e) => setHighlightsText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>SNS 및 웹사이트</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['website', 'instagram', 'facebook', 'youtube', 'blog'] as const).map((key) => (
                        <Input
                          key={key}
                          value={group.socialLinks[key] || ''}
                          onChange={(e) =>
                            setGroup({
                              ...group,
                              socialLinks: { ...group.socialLinks, [key]: e.target.value },
                            })
                          }
                          placeholder={key}
                        />
                      ))}
                    </div>
                  </div>

                  <Button onClick={saveGroup} disabled={isSavingGroup}>
                    {isSavingGroup ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    극단 정보 저장
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>공연 예약 링크</CardTitle>
                  <CardDescription>
                    링크를 등록하면 사이트의 &quot;무료 예약하기&quot; 버튼이 활성화됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {programs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">등록된 공연이 없습니다.</p>
                  ) : (
                    programs.map((program) => (
                      <div key={program._id} className="space-y-2 rounded-lg border p-4">
                        <p className="font-medium">{program.title}</p>
                        <p className="text-xs text-muted-foreground">{program.venue}</p>
                        <div className="flex gap-2">
                          <Input
                            value={ticketUrls[program._id] || ''}
                            onChange={(e) =>
                              setTicketUrls({ ...ticketUrls, [program._id]: e.target.value })
                            }
                            placeholder="https://forms.gle/... (예약 링크)"
                          />
                          <Button
                            variant="outline"
                            onClick={() => saveTicketUrl(program._id)}
                            disabled={savingProgramId === program._id}
                          >
                            {savingProgramId === program._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '저장'
                            )}
                          </Button>
                          {program.ticketUrl && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={program.ticketUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
