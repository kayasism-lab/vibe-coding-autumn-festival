'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAdminAccount } from '@/lib/use-admin-account'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Film, Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'

type GalleryItem = {
  _id: string
  title: string
  description?: string
  type: 'photo' | 'video'
  url: string
  thumbnailUrl?: string
  order: number
  createdAt: string
}

type GalleryForm = {
  title: string
  description: string
  type: GalleryItem['type']
  url: string
  thumbnailUrl: string
  order: number
}

const emptyForm: GalleryForm = {
  title: '',
  description: '',
  type: 'photo',
  url: '',
  thumbnailUrl: '',
  order: 0,
}

export default function AdminGalleryPage() {
  // 극단 담당자는 등록·수정만 가능하고 삭제는 관리자 몫이다
  const { isGroupAccount } = useAdminAccount()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [yearFilter, setYearFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState<GalleryForm>(emptyForm)

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/gallery')
      const data = await res.json()
      if (data.success) setItems(data.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const years = Array.from(new Set(items.map((item) => new Date(item.createdAt).getFullYear().toString()))).sort().reverse()
  const filteredItems = yearFilter === 'all'
    ? items
    : items.filter((item) => new Date(item.createdAt).getFullYear().toString() === yearFilter)

  const openDialog = (item?: GalleryItem) => {
    setEditingItem(item || null)
    setForm(
      item
        ? {
            title: item.title,
            description: item.description || '',
            type: item.type,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl || '',
            order: item.order,
          }
        : { ...emptyForm, order: items.length }
    )
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(editingItem ? `/api/gallery/${editingItem._id}` : '/api/gallery', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          url: form.url,
          thumbnailUrl: form.thumbnailUrl || undefined,
          order: form.order,
        }),
      })
      if (res.ok) {
        await fetchItems()
        setIsDialogOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) fetchItems()
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">갤러리 관리</h1>
              <p className="text-muted-foreground">축제 사진 및 영상을 관리합니다.</p>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              미디어 추가
            </Button>
          </div>

          <div className="mb-6">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="rounded-xl border bg-card p-8 text-center">불러오는 중...</div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">등록된 갤러리가 없습니다.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div key={item._id} className="group relative bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] relative bg-muted">
                    <img src={item.thumbnailUrl || item.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.type === 'video' ? <><Film className="h-3 w-3 mr-1" /> 영상</> : <><ImageIcon className="h-3 w-3 mr-1" /> 사진</>}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openDialog(item)}><Pencil className="h-4 w-4" /></Button>
                      {!isGroupAccount && (
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(item._id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).getFullYear()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '미디어 수정' : '미디어 추가'}</DialogTitle>
            <DialogDescription>사진 또는 영상 정보를 입력합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="유형">
              <Select value={form.type} onValueChange={(type: GalleryItem['type']) => setForm({ ...form, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">사진</SelectItem>
                  <SelectItem value="video">영상</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="제목"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            {form.type === 'photo' ? (
              <Field label="사진 이미지">
                <CloudinaryUpload
                  value={form.url}
                  onChange={(url) => setForm({ ...form, url: url as string })}
                  folder="autumn_festival/gallery"
                  placeholder="갤러리 사진 업로드"
                />
              </Field>
            ) : (
              <Field label="영상 URL">
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </Field>
            )}
            <Field label="썸네일 이미지">
              <CloudinaryUpload
                value={form.thumbnailUrl}
                onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl: thumbnailUrl as string })}
                folder="autumn_festival/gallery/thumbnails"
                placeholder="썸네일 이미지 업로드"
              />
            </Field>
            <Field label="설명"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="정렬"><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>{editingItem ? '수정' : '추가'}</Button>
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
