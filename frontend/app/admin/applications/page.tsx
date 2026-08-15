'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Eye,
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  Users,
  Clock,
  FileText,
} from 'lucide-react'
import Image from 'next/image'

interface Application {
  _id: string
  groupName: string
  representative: string
  email: string
  phone: string
  playTitle: string
  playType: 'play' | 'musical' | 'short_play'
  runtime: number
  synopsis: string
  memberCount: number
  attachmentUrls: string[]
  status: 'pending' | 'approved' | 'rejected'
  adminNote?: string
  createdAt: string
}

const playTypeLabels = {
  play: '연극',
  musical: '뮤지컬',
  short_play: '단막극',
}

const statusLabels = {
  pending: { label: '심사중', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' },
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications')
      const data = await res.json()
      if (data.success) {
        setApplications(data.data.items)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openDetail = (app: Application) => {
    setSelectedApp(app)
    setAdminNote(app.adminNote || '')
    setIsDialogOpen(true)
  }

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedApp) return

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/applications/${selectedApp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      })

      if (res.ok) {
        fetchApplications()
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to update application:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const approvedCount = applications.filter((a) => a.status === 'approved').length

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">참가 신청 관리</h1>
            <p className="text-muted-foreground mt-1">
              축제 참가 신청을 검토하고 승인/반려합니다.
            </p>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
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
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">승인 완료</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* 신청 목록 */}
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
                <div className="text-center py-12 text-muted-foreground">
                  접수된 신청이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>극단명</TableHead>
                      <TableHead>작품명</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-20">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell className="font-medium">{app.groupName}</TableCell>
                        <TableCell>{app.playTitle}</TableCell>
                        <TableCell>{playTypeLabels[app.playType]}</TableCell>
                        <TableCell>
                          {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusLabels[app.status].color}>
                            {statusLabels[app.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetail(app)}
                          >
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

        {/* 상세 보기 Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedApp && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>{selectedApp.groupName}</DialogTitle>
                    <Badge className={statusLabels[selectedApp.status].color}>
                      {statusLabels[selectedApp.status].label}
                    </Badge>
                  </div>
                  <DialogDescription>
                    {new Date(selectedApp.createdAt).toLocaleString('ko-KR')} 신청
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* 연락처 정보 */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">대표: </span>
                        {selectedApp.representative}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedApp.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedApp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">단원 {selectedApp.memberCount}명</span>
                    </div>
                  </div>

                  {/* 작품 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      작품 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">작품명</p>
                        <p className="font-medium">{selectedApp.playTitle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">유형</p>
                        <p className="font-medium">{playTypeLabels[selectedApp.playType]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>러닝타임: {selectedApp.runtime}분</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">시놉시스</p>
                      <p className="text-sm bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                        {selectedApp.synopsis}
                      </p>
                    </div>
                  </div>

                  {/* 첨부파일 */}
                  {selectedApp.attachmentUrls.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">첨부파일</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedApp.attachmentUrls.map((url, idx) => (
                          <div key={idx} className="relative aspect-video rounded overflow-hidden">
                            <Image src={url} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 관리자 메모 */}
                  <div className="space-y-2">
                    <Label>관리자 메모</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="심사 관련 메모를 작성하세요..."
                      rows={3}
                    />
                  </div>

                  {/* 액션 버튼 */}
                  {selectedApp.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => updateStatus('approved')}
                        disabled={isUpdating}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            승인
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => updateStatus('rejected')}
                        disabled={isUpdating}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            반려
                          </>
                        )}
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
