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
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
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

// 낭독극·단막극 담당 계정은 페이지 제목도 담당 유형에 맞게 보여준다. 그 외(관리자)는 전체를 다룬다는 원래 문구 그대로.
const pageHeadingByProgramType: Record<string, { title: string; description: string }> = {
  reading: { title: '낭독극 신청자 관리', description: '열린 낭독극 시민 참여 신청을 검토합니다.' },
  short_play: { title: '단막극 신청자 관리', description: '열린 단막극 시민 참여 신청을 검토합니다.' },
}

export default function AdminCitizenApplicationsPage() {
  const [applications, setApplications] = useState<CitizenApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<CitizenApplication | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  // 심사 결과 저장에 실패한 사유. 값이 있으면 창을 닫지 않고 그대로 보여준다
  const [saveError, setSaveError] = useState('')
  // 승인·반려는 총괄 관리자만 가능하다. 담당 계정은 열람·문의 답변까지만.
  const [canDecide, setCanDecide] = useState(false)
  const [heading, setHeading] = useState({ title: '시민 참여 신청 관리', description: '열린 낭독극·열린 단막극 시민 참여 신청을 검토합니다.' })

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

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return
        const role = data.data?.role
        setCanDecide(role === 'superadmin' || role === 'admin')
        const programType = data.data?.programType as string | undefined
        if (programType && pageHeadingByProgramType[programType]) {
          setHeading(pageHeadingByProgramType[programType])
        }
      })
      .catch(() => {})
  }, [])

  const openDetail = (app: CitizenApplication) => {
    setSelected(app)
    setAdminNote(app.adminNote || '')
    setSaveError('')
    setIsDialogOpen(true)
  }

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!selected) return
    setIsUpdating(true)
    setSaveError('')
    try {
      const res = await adminFetch(`/api/citizen-applications/${selected._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      })
      if (res.ok) {
        fetchApplications()
        setIsDialogOpen(false)
        return
      }

      // 실패했으면 창을 닫지 않는다. 작성한 심사 메모를 지키기 위해
      setSaveError(await getErrorMessage(res))
    } catch {
      setSaveError('처리 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQnaReply = async (text: string): Promise<string | void> => {
    if (!selected) return '신청 내역을 먼저 선택해주세요.'
    try {
      const res = await adminFetch(`/api/citizen-applications/${selected._id}/qna/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      // 401 등은 본문이 JSON이 아닐 수 있어 파싱 전에 상태부터 본다
      if (!res.ok) return await getErrorMessage(res)

      const data = await res.json()
      if (!data.success) return data.error || '문의 등록에 실패했습니다.'
      setSelected(data.data)
      fetchApplications()
    } catch {
      return '등록 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.'
    }
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-6 pt-20 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{heading.title}</h1>
            <p className="mt-1 text-muted-foreground">{heading.description}</p>
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
          saveError={saveError}
          onUpdateStatus={updateStatus}
          onQnaSubmit={handleQnaReply}
          canDecide={canDecide}
        />
      </main>
    </div>
  )
}
