'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAdminAccount } from '@/lib/use-admin-account'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { VideoThumbnailPicker } from '@/components/admin/video-thumbnail-picker'
import {
  GALLERY_CATEGORIES,
  getGalleryCategoryLabel,
  getTheaterGroupId,
  getTheaterGroupName,
  type GalleryTheaterGroup,
} from '@/lib/gallery-taxonomy'
import type { GalleryCategory } from '@/types'
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
  category?: GalleryCategory
  url: string
  thumbnailUrl?: string
  theaterGroup?: GalleryTheaterGroup
  order: number
  createdAt: string
}

type TheaterGroupOption = { _id: string; name: string }

type GalleryForm = {
  title: string
  description: string
  type: GalleryItem['type']
  category: GalleryCategory
  url: string
  thumbnailUrl: string
  /** 빈 문자열이면 '지정 안 함' */
  theaterGroupId: string
  order: number
}

const emptyForm: GalleryForm = {
  title: '',
  description: '',
  type: 'photo',
  category: 'festival',
  url: '',
  thumbnailUrl: '',
  theaterGroupId: '',
  order: 0,
}

/** Select는 빈 문자열을 값으로 쓸 수 없어 '지정 안 함'에 따로 값을 준다 */
const NO_GROUP = 'none'

export default function AdminGalleryPage() {
  // 극단 담당자는 등록·수정만 가능하고 삭제는 관리자 몫이다
  const { isGroupAccount, theaterGroup: myGroupId } = useAdminAccount()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [yearFilter, setYearFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState<GalleryForm>(emptyForm)
  const [groups, setGroups] = useState<TheaterGroupOption[]>([])

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
    // 극단 선택 목록. 실패해도 갤러리 관리 자체는 되어야 하므로 조용히 넘긴다
    fetch('/api/theater-groups?active=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGroups(data.data)
      })
      .catch(() => setGroups([]))
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
            category: item.category ?? 'etc',
            url: item.url,
            thumbnailUrl: item.thumbnailUrl || '',
            theaterGroupId: getTheaterGroupId(item.theaterGroup),
            order: item.order,
          }
        // 극단 담당자가 새로 올릴 때는 자기 극단을 미리 골라둔다
        : { ...emptyForm, theaterGroupId: myGroupId ?? '', order: items.length }
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
          category: form.category,
          // '지정 안 함'으로 되돌린 것을 서버에 전하려면 null을 명시해야 한다
          theaterGroup: form.theaterGroupId || null,
          url: form.url,
          // 사진은 올린 이미지를 그대로 쓰므로 썸네일을 비운다.
          // undefined로 보내면 JSON에서 아예 빠져 서버가 기존 값을 유지하므로 null을 명시해야 지워진다
          thumbnailUrl: form.type === 'video' ? form.thumbnailUrl || null : null,
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
                    {/* 썸네일 없는 영상은 주소를 이미지로 그릴 수 없어 자리 표시를 둔다 */}
                    {item.type === 'photo' || item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl || item.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted-foreground/10 text-xs text-muted-foreground">
                        썸네일 없음
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.type === 'video' ? <><Film className="h-3 w-3 mr-1" /> 영상</> : <><ImageIcon className="h-3 w-3 mr-1" /> 사진</>}
                      </Badge>
                    </div>
                    {/* 예전에는 마우스를 올렸을 때만 보였는데, 터치 화면에는 그 동작이 없어
                        휴대폰에서는 수정 자체를 할 수 없었다. 그래서 늘 보이게 둔다 */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openDialog(item)}><Pencil className="h-4 w-4" /></Button>
                      {!isGroupAccount && (
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(item._id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    {/* 분류를 목록에서 바로 확인할 수 있어야 잘못 넣은 자료를 찾아낼 수 있다 */}
                    <p className="text-xs text-muted-foreground truncate">
                      {getGalleryCategoryLabel(item.category)}
                      {getTheaterGroupName(item.theaterGroup) && ` · ${getTheaterGroupName(item.theaterGroup)}`}
                      {` · ${new Date(item.createdAt).getFullYear()}`}
                    </p>
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
            <Field label="구분">
              <Select
                value={form.category}
                onValueChange={(category: GalleryCategory) => setForm({ ...form, category })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GALLERY_CATEGORIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="극단">
              <Select
                value={form.theaterGroupId || NO_GROUP}
                onValueChange={(value) =>
                  setForm({ ...form, theaterGroupId: value === NO_GROUP ? '' : value })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {/* 협의회 공동 행사처럼 특정 극단이 없는 자료도 있다 */}
                  <SelectItem value={NO_GROUP}>지정 안 함</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group._id} value={group._id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="제목"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            {/* 사진은 올린 이미지가 곧 썸네일이라 따로 받지 않는다.
                영상은 이미지가 없으므로 영상 주소에서 뽑아낸 후보 중에서 고르게 한다 */}
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
              <>
                <Field label="영상 URL">
                  <Input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </Field>
                <Field label="썸네일 이미지">
                  <VideoThumbnailPicker
                    videoUrl={form.url}
                    value={form.thumbnailUrl}
                    onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })}
                  />
                </Field>
              </>
            )}
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
