'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAdminAccount } from '@/lib/use-admin-account'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { ArticleLinkImport } from '@/components/admin/article-link-import'
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
import { looksLikeHtml } from '@/lib/notice-board'

type Notice = {
  _id: string
  title: string
  content: string
  category: 'notice' | 'press' | 'event' | 'media'
  imageUrls: string[]
  isPinned: boolean
  viewCount: number
  publishedAt?: string
  sourceUrl?: string
  sourceName?: string
  createdAt: string
}

type NoticeForm = {
  title: string
  content: string
  category: Notice['category']
  imageUrls: string[]
  isPinned: boolean
  /** 'YYYY-MM-DD'. 예전 보도를 뒤늦게 올릴 때 그 시절 날짜를 넣는다 */
  publishedAt: string
  /** 보도자료 원문 주소와 실은 곳 */
  sourceUrl: string
  sourceName: string
}

/** 오늘 날짜를 'YYYY-MM-DD'로 (한국 시각 기준) */
function todayInKst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** 저장된 값을 날짜 입력칸에 넣을 모양으로 (한국 시각 기준) */
function toDateInput(value?: string): string {
  if (!value) return todayInKst()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const emptyForm: NoticeForm = {
  title: '',
  content: '',
  category: 'notice',
  imageUrls: [],
  isPinned: false,
  publishedAt: '',
  sourceUrl: '',
  sourceName: '',
}

const categoryLabels = {
  notice: '공지',
  press: '보도자료',
  event: '이벤트',
  media: '미디어',
}

export default function AdminNoticesPage() {
  // 극단 담당자는 작성·수정만 가능하고 삭제는 관리자 몫이다
  const { isGroupAccount } = useAdminAccount()
  const [notices, setNotices] = useState<Notice[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // HTML로 쓴 공지가 어떻게 보일지 저장 전에 확인하는 창
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
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
    // 다른 글을 열 때 이전 글의 미리보기가 펼쳐진 채로 남지 않게 한다
    setIsPreviewOpen(false)
    setForm(
      notice
        ? {
            title: notice.title,
            content: notice.content,
            category: notice.category,
            imageUrls: notice.imageUrls,
            isPinned: notice.isPinned,
            publishedAt: toDateInput(notice.publishedAt ?? notice.createdAt),
            sourceUrl: notice.sourceUrl ?? '',
            sourceName: notice.sourceName ?? '',
          }
        // 새 글은 오늘 날짜로 시작한다. 예전 보도라면 관리자가 날짜를 바꾸면 된다
        : { ...emptyForm, publishedAt: todayInKst() }
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
        // 날짜만 받으므로 한국 시각 정오로 저장한다.
        // 자정으로 두면 시간대 차이로 하루 앞뒤가 밀려 보일 수 있다
        publishedAt: form.publishedAt ? `${form.publishedAt}T12:00:00+09:00` : undefined,
        // 지웠을 때도 서버에 전해지도록 빈 값은 null로 보낸다
        sourceUrl: form.sourceUrl || null,
        sourceName: form.sourceName || null,
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
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
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
                    {/* 예전 보도는 등록 시각이 아니라 실제 보도된 날짜를 보여준다 */}
                    <TableCell>{new Date(notice.publishedAt ?? notice.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(notice)}><Pencil className="h-4 w-4" /></Button>
                      {!isGroupAccount && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(notice._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
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
            {/* 보도자료·미디어를 올릴 때만 쓰는 기능이라 그 종류에서만 보여준다 */}
            {(form.category === 'press' || form.category === 'media') && (
              <ArticleLinkImport
                onLoaded={(preview) =>
                  setForm((prev) => ({
                    ...prev,
                    // 이미 적어둔 제목이 있으면 덮어쓰지 않는다
                    title: prev.title || preview.title,
                    publishedAt: preview.publishedAt
                      ? toDateInput(preview.publishedAt)
                      : prev.publishedAt,
                    imageUrls: preview.imageUrl ? [preview.imageUrl] : prev.imageUrls,
                    sourceUrl: preview.url,
                    sourceName: preview.siteName,
                  }))
                }
              />
            )}

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
            <Field label="날짜">
              <Input
                type="date"
                value={form.publishedAt}
                onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
              />
              {/* 예전 보도를 참고용으로 지금 올릴 수 있어야 해서 날짜를 직접 고르게 한다 */}
              <p className="text-xs text-muted-foreground">
                목록에 표시되고 정렬 기준이 되는 날짜입니다. 예전 보도자료를 올릴 때는 실제
                보도된 날짜로 바꿔주세요.
              </p>
            </Field>
            <Field label="내용">
              <Textarea
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="font-mono text-xs"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  일반 글은 그대로 쓰시면 됩니다. 꾸민 공지를 만들었다면 HTML을 붙여넣어도
                  그 모양대로 보입니다.
                </p>
                {/* 붙여넣은 HTML이 어떻게 보일지 저장 전에 확인할 수 있어야 한다 */}
                {looksLikeHtml(form.content) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setIsPreviewOpen((prev) => !prev)}
                  >
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    {isPreviewOpen ? '미리보기 닫기' : '미리보기'}
                  </Button>
                )}
              </div>

              {isPreviewOpen && looksLikeHtml(form.content) && (
                <div className="rounded-lg border bg-background p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    아래는 대략적인 모습입니다. 저장할 때 위험한 태그는 자동으로 걸러집니다.
                  </p>
                  <div
                    className="notice-html"
                    dangerouslySetInnerHTML={{ __html: form.content }}
                  />
                </div>
              )}
            </Field>
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
            {/* 불러오기로 채워지지만, 손으로 고치거나 지울 수 있어야 한다 */}
            {(form.category === 'press' || form.category === 'media') && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="원문 주소">
                    <Input
                      value={form.sourceUrl}
                      onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </Field>
                </div>
                <Field label="출처">
                  <Input
                    value={form.sourceName}
                    onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                    placeholder="예: 연합뉴스"
                  />
                </Field>
              </div>
            )}

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
