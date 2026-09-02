'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Lock, MessageSquare, Search, Send, Trash2 } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'

type Inquiry = {
  _id: string
  title: string
  name: string
  email: string
  content: string
  status: 'pending' | 'answered'
  isPrivate: boolean
  createdAt: string
  reply?: {
    content: string
    repliedAt: string
  }
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // 답변 등록에 실패한 사유. 값이 있으면 창을 닫지 않고 그대로 보여준다
  const [saveError, setSaveError] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`
      const res = await fetch(`/api/inquiries${query}`)
      const data = await res.json()
      if (data.success) setInquiries(data.data.items)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const filteredInquiries = inquiries.filter((inquiry) =>
    `${inquiry.title} ${inquiry.name} ${inquiry.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openReplyDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setSaveError('')
    setReplyContent(inquiry.reply?.content || '')
  }

  const handleReply = async () => {
    if (!selectedInquiry || !replyContent.trim()) return
    setIsSaving(true)
    setSaveError('')
    try {
      const res = await adminFetch(`/api/inquiries/${selectedInquiry._id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      })
      if (res.ok) {
        await fetchInquiries()
        setSelectedInquiry(null)
        setReplyContent('')
        return
      }

      // 실패했으면 창을 닫지 않는다. 작성한 답변을 다시 쓰지 않아도 되도록
      setSaveError(await getErrorMessage(res))
    } catch {
      setSaveError('등록 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await adminFetch(`/api/inquiries/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchInquiries()
      return
    }
    alert(await getErrorMessage(res))
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">문의 관리</h1>
            <p className="text-muted-foreground">고객 문의를 확인하고 답변합니다.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="문의 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="pending">대기중</TabsTrigger>
                <TabsTrigger value="answered">답변완료</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">불러오는 중...</TableCell></TableRow>
                ) : filteredInquiries.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">등록된 문의가 없습니다.</TableCell></TableRow>
                ) : filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry._id}>
                    <TableCell><Badge variant={inquiry.status === 'pending' ? 'secondary' : 'default'}>{inquiry.status === 'pending' ? '대기중' : '답변완료'}</Badge></TableCell>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {inquiry.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {inquiry.title}
                      </span>
                    </TableCell>
                    <TableCell>{inquiry.name}</TableCell>
                    <TableCell>{inquiry.email}</TableCell>
                    <TableCell>{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openReplyDialog(inquiry)}>
                        <MessageSquare className="mr-1 h-4 w-4" />
                        {inquiry.status === 'pending' ? '답변하기' : '답변 수정'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inquiry._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>문의 답변</DialogTitle>
            <DialogDescription>{selectedInquiry?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-muted-foreground">
                <span>{selectedInquiry?.name}</span>
                <span>({selectedInquiry?.email})</span>
                <span>{selectedInquiry && new Date(selectedInquiry.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <p className="text-foreground whitespace-pre-line">{selectedInquiry?.content}</p>
            </div>
            <div className="space-y-2">
              <Label>답변</Label>
              <Textarea rows={6} value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="답변을 입력하세요..." />
            </div>
          </div>
          {saveError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {saveError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>취소</Button>
            <Button onClick={handleReply} disabled={isSaving}>
              <Send className="mr-2 h-4 w-4" />
              답변 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
