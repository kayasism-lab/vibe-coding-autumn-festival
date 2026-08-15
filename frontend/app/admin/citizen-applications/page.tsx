'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Check, Eye, Loader2, Mail, MapPin, Phone, X } from 'lucide-react'

type Status = 'pending' | 'approved' | 'rejected'

interface CitizenApplication {
  _id: string
  programId: { _id: string; title: string }
  name: string
  phone: string
  email: string
  region: { sido: string; gu: string }
  motivation: string
  experience?: string
  status: Status
  adminNote?: string
  createdAt: string
}

const statusLabels: Record<Status, { label: string; color: string }> = {
  pending: { label: '심사중', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' },
}

export default function AdminCitizenApplicationsPage() {
  const [applications, setApplications] = useState<CitizenApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<CitizenApplication | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/citizen-applications')
      const data = await res.json()
      if (data.success) setApplications(data.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const openDetail = (app: CitizenApplication) => {
    setSelected(app)
    setAdminNote(app.adminNote || '')
    setIsDialogOpen(true)
  }

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!selected) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/citizen-applications/${selected._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      })
      if (res.ok) {
        fetchApplications()
        setIsDialogOpen(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-6 pt-20 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">시민 참여 신청 관리</h1>
            <p className="mt-1 text-muted-foreground">열린 낭독극·열린 단막극 시민 참여 신청을 검토합니다.</p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">전체 신청</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">심사 대기</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>신청 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : applications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">접수된 신청이 없습니다.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>신청 프로그램</TableHead>
                      <TableHead>거주지역</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-20">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{app.programId.title}</TableCell>
                        <TableCell>{app.region.sido} {app.region.gu}</TableCell>
                        <TableCell>{new Date(app.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell>
                          <Badge className={statusLabels[app.status].color}>{statusLabels[app.status].label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openDetail(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>{selected.name}</DialogTitle>
                    <Badge className={statusLabels[selected.status].color}>{statusLabels[selected.status].label}</Badge>
                  </div>
                  <DialogDescription>
                    {selected.programId.title} · {new Date(selected.createdAt).toLocaleString('ko-KR')} 신청
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selected.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selected.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {selected.region.sido} {selected.region.gu}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">신청 계기</p>
                    <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm">{selected.motivation}</p>
                  </div>

                  {selected.experience && (
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">관련 경력</p>
                      <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm">{selected.experience}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>관리자 메모</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="심사 관련 메모를 작성하세요..."
                      rows={3}
                    />
                  </div>

                  {selected.status === 'pending' && (
                    <div className="flex gap-3 border-t pt-4">
                      <Button
                        onClick={() => updateStatus('approved')}
                        disabled={isUpdating}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" />승인</>}
                      </Button>
                      <Button onClick={() => updateStatus('rejected')} disabled={isUpdating} variant="destructive" className="flex-1">
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="mr-2 h-4 w-4" />반려</>}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
