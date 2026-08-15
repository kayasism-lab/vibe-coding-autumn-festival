'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Pencil, Pin, Plus, Search, Trash2 } from 'lucide-react'

type Notice = {
  _id: string
  title: string
  content: string
  category: 'notice' | 'press' | 'event' | 'media'
  imageUrls: string[]
  isPinned: boolean
  viewCount: number
  createdAt: string
}

type NoticeForm = {
  title: string
  content: string
  category: Notice['category']
  imageUrls: string[]
  isPinned: boolean
}

const emptyForm: NoticeForm = {
  title: '',
  content: '',
  category: 'notice',
  imageUrls: [],
  isPinned: false,
}

const categoryLabels = {
  notice: '공지',
  press: '보도자료',
  event: '이벤트',
  media: '미디어',
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [form, setForm] = useState<NoticeForm>(emptyForm)

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices?limit=100')
      const data = await res.json()
      if (data.success) setNotices(data.data.items)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openDialog = (notice?: Notice) => {
    setEditingNotice(notice || null)
    setForm(
      notice
        ? {
            title: notice.title,
            content: notice.content,
            category: notice.category,
            imageUrls: notice.imageUrls,
            isPinned: notice.isPinned,
          }
        : emptyForm
    )
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        title: form.title,
        content: form.content,
        category: form.category,
        isPinned: form.isPinned,
        imageUrls: form.imageUrls,
      }
      const res = await fetch(editingNotice ? `/api/notices/${editingNotice._id}` : '/api/notices', {
        method: editingNotice ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchNotices()
        setIsDialogOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
    if (res.ok) fetchNotices()
  }

  return (
    <div className="min-h-screen bg-muted">
      <AdminSidebar />
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">공지 관리</h1>
              <p className="text-muted-foreground">공지사항을 관리합니다.</p>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              공지 작성
            </Button>
          </div>

          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="공지사항 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">불러오는 중...</TableCell></TableRow>
                ) : filteredNotices.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">등록된 공지가 없습니다.</TableCell></TableRow>
                ) : filteredNotices.map((notice) => (
                  <TableRow key={notice._id}>
                    <TableCell>{notice.isPinned && <Pin className="h-4 w-4 text-primary" />}</TableCell>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell><Badge variant="outline">{categoryLabels[notice.category]}</Badge></TableCell>
                    <TableCell><span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" />{notice.viewCount}</span></TableCell>
                    <TableCell>{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(notice)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(notice._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNotice ? '공지 수정' : '공지 작성'}</DialogTitle>
            <DialogDescription>공지사항 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="제목"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="카테고리">
                <Select value={form.category} onValueChange={(category: Notice['category']) => setForm({ ...form, category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notice">공지</SelectItem>
                    <SelectItem value="press">보도자료</SelectItem>
                    <SelectItem value="event">이벤트</SelectItem>
                    <SelectItem value="media">미디어</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="내용"><Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
            <Field label="첨부 이미지">
              <CloudinaryUpload
                value={form.imageUrls}
                onChange={(imageUrls) => setForm({ ...form, imageUrls: imageUrls as string[] })}
                multiple
                maxFiles={8}
                folder="autumn_festival/notices"
                placeholder="공지 이미지 업로드"
              />
            </Field>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isPinned} onCheckedChange={(isPinned) => setForm({ ...form, isPinned: Boolean(isPinned) })} />
              <Label>상단 고정</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>{editingNotice ? '수정' : '작성'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
