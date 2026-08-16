'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Loader2 } from 'lucide-react'
import {
  CitizenApplicationDetailDialog,
  type CitizenApplication,
} from '@/components/admin/citizen-application-detail-dialog'

const statusLabels = {
  pending: { label: '심사중', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' },
}

const programTypeLabels = {
  reading: '열린 낭독극',
  short_play: '열린 단막극',
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

  const handleQnaReply = async (text: string): Promise<string | void> => {
    if (!selected) return '신청 내역을 먼저 선택해주세요.'
    const res = await fetch(`/api/citizen-applications/${selected._id}/qna/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })
    const data = await res.json()
    if (!data.success) return data.error || '문의 등록에 실패했습니다.'
    setSelected(data.data)
    fetchApplications()
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
                      <TableHead>신청 구분</TableHead>
                      <TableHead>사는곳</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-20">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{programTypeLabels[app.programType]}</TableCell>
                        <TableCell>{app.residence}</TableCell>
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

        <CitizenApplicationDetailDialog
          selected={selected}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          adminNote={adminNote}
          onAdminNoteChange={setAdminNote}
          isUpdating={isUpdating}
          onUpdateStatus={updateStatus}
          onQnaSubmit={handleQnaReply}
        />
      </main>
    </div>
  )
}
