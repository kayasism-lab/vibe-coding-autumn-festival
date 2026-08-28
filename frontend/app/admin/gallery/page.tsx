'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAdminAccount } from '@/lib/use-admin-account'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { VideoThumbnailPicker } from '@/components/admin/video-thumbnail-picker'
import { VideoUrlHint } from '@/components/admin/video-url-hint'
import {
  GALLERY_CARD_RATIOS,
  GALLERY_CATEGORIES,
  getGalleryCategoryLabel,
  getGalleryImages,
  getTheaterGroupId,
  getTheaterGroupName,
  sortGalleryLatestFirst,
  toRatioNumber,
  type GalleryCardRatio,
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
  images?: string[]
  cardRatio?: GalleryCardRatio
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
  /** 영상 주소 (사진일 때는 images의 첫 장이 들어간다) */
  url: string
  /** 사진 여러 장 */
  images: string[]
  /** 목록에 보일 대표 사진의 순번 */
  coverIndex: number
  /** 목록에서 이 자료가 차지할 칸 모양 */
  cardRatio: GalleryCardRatio
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
  images: [],
  coverIndex: 0,
  cardRatio: '4:3',
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
  // 자료가 쌓이면 연도만으로는 원하는 것을 찾기 어려워 분류 조건을 함께 둔다
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState<GalleryForm>(emptyForm)
  /** 저장에 실패한 이유. 지금까지는 실패해도 아무 말이 없어 눌러도 반응이 없어 보였다 */
  const [saveError, setSaveError] = useState('')
  const [groups, setGroups] = useState<TheaterGroupOption[]>([])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/gallery')
      const data = await res.json()
      // 최근에 올린 자료가 위에 오도록 화면에서도 한 번 더 맞춰둔다
      if (data.success) setItems(sortGalleryLatestFirst(data.data))
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

  // 등록된 자료에 실제로 쓰인 극단만 고를 수 있게 한다
  const usedGroups = Array.from(
    new Map(
      items
        .map((item) => [getTheaterGroupId(item.theaterGroup), getTheaterGroupName(item.theaterGroup)])
        .filter(([id, name]) => id && name) as [string, string][]
    )
  )

  const filteredItems = items.filter((item) => {
    const year = new Date(item.createdAt).getFullYear().toString()
    return (
      (typeFilter === 'all' || item.type === typeFilter) &&
      (categoryFilter === 'all' || (item.category ?? 'etc') === categoryFilter) &&
      (groupFilter === 'all' || getTheaterGroupId(item.theaterGroup) === groupFilter) &&
      (yearFilter === 'all' || year === yearFilter)
    )
  })

  const openDialog = (item?: GalleryItem) => {
    setEditingItem(item || null)
    // 지난번 실패 안내가 새 창에 남아 있으면 헷갈린다
    setSaveError('')
    setForm(
      item
        ? {
            title: item.title,
            description: item.description || '',
            type: item.type,
            category: item.category ?? 'etc',
            url: item.url,
            // 예전 자료는 url 하나뿐이라 그 값을 한 장짜리 목록으로 본다
            images: getGalleryImages(item),
            // 저장된 대표 사진(url)이 몇 번째인지 찾아 되살린다. 못 찾으면 첫 장
            coverIndex: Math.max(0, getGalleryImages(item).indexOf(item.url)),
            cardRatio: item.cardRatio || '4:3',
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
    setSaveError('')
    try {
      const res = await adminFetch(editingItem ? `/api/gallery/${editingItem._id}` : '/api/gallery', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          category: form.category,
          // '지정 안 함'으로 되돌린 것을 서버에 전하려면 null을 명시해야 한다
          theaterGroup: form.theaterGroupId || null,
          // 사진은 대표로 고른 한 장을 url로 함께 저장한다.
          // 목록·미리보기 등 예전부터 url을 보던 화면이 그대로 동작하도록
          url: form.type === 'photo' ? form.images[form.coverIndex] ?? form.images[0] ?? '' : form.url,
          images: form.type === 'photo' ? form.images : [],
          cardRatio: form.cardRatio,
          // 사진은 올린 이미지를 그대로 쓰므로 썸네일을 비운다.
          // undefined로 보내면 JSON에서 아예 빠져 서버가 기존 값을 유지하므로 null을 명시해야 지워진다
          thumbnailUrl: form.type === 'video' ? form.thumbnailUrl || null : null,
          order: form.order,
        }),
      })
      if (res.ok) {
        await fetchItems()
        setIsDialogOpen(false)
        return
      }

      // 실패했으면 창을 닫지 않는다. 올려둔 사진을 다시 고르지 않아도 되도록
      setSaveError(await getErrorMessage(res))
    } catch {
      setSaveError('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await adminFetch(`/api/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchItems()
      return
    }
    alert(await getErrorMessage(res))
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

          {/* 분류별로 골라서 관리할 수 있게 한다. 좁은 화면에서는 아래로 접힌다 */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="종류" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">종류 전체</SelectItem>
                <SelectItem value="photo">사진</SelectItem>
                <SelectItem value="video">영상</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="구분" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">구분 전체</SelectItem>
                {GALLERY_CATEGORIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 극단이 지정된 자료가 없으면 조건 자체를 보여주지 않는다 */}
            {usedGroups.length > 0 && (
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="극단" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">극단 전체</SelectItem>
                  {usedGroups.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="연도" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">연도 전체</SelectItem>
                {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>

            <span className="ml-auto text-sm text-muted-foreground">
              총 {filteredItems.length}개
            </span>
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
              <Field label="사진">
                {/* 비율 버튼은 미리보기용이 아니라 실제 목록 칸 모양을 정한다.
                    aspectRatio를 함께 넘겨야 바깥에서 정한 값이 미리보기에 반영된다 */}
                <CloudinaryUpload
                  value={form.images}
                  onChange={(images) => setForm({ ...form, images: images as string[] })}
                  multiple
                  maxFiles={20}
                  folder="autumn_festival/gallery"
                  placeholder="갤러리 사진 업로드"
                  aspectRatio={toRatioNumber(form.cardRatio)}
                  aspectRatios={GALLERY_CARD_RATIOS.map((item) => ({
                    label: item.label,
                    value: toRatioNumber(item.value),
                  }))}
                  onRatioChange={(value) => {
                    const picked = GALLERY_CARD_RATIOS.find(
                      (item) => Math.abs(toRatioNumber(item.value) - value) < 0.001
                    )
                    if (picked) setForm((prev) => ({ ...prev, cardRatio: picked.value }))
                  }}
                  coverIndex={form.coverIndex}
                  onSelectCover={(coverIndex) => setForm((prev) => ({ ...prev, coverIndex }))}
                />
                <p className="text-xs text-muted-foreground">
                  위 비율 버튼은 <strong className="font-medium">목록에서 이 자료가 차지할 칸 모양</strong>입니다.
                  세로로 긴 사진은 3:4, 넓은 무대 사진은 16:9가 덜 잘립니다. 크게 보기에서는
                  비율과 상관없이 사진 전체가 보입니다. 큰 사진은 올릴 때 자동으로 줄여 저장합니다.
                </p>
              </Field>
            ) : (
              <>
                <Field label="영상 URL">
                  <Input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="유튜브 · 비메오 · 인스타그램 주소"
                  />
                  {/* 어떤 곳을 넣을 수 있고 어떻게 동작하는지 등록 전에 알려준다 */}
                  <VideoUrlHint url={form.url} />
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
            <Field label="정렬">
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              {/* 최신순이 기본이라, 특정 자료를 위로 올리고 싶을 때만 손대면 된다 */}
              <p className="text-xs text-muted-foreground">
                숫자가 클수록 앞에 나옵니다. 기본은 최근에 올린 순서이니 그대로 두셔도 됩니다.
              </p>
            </Field>
          </div>
          {saveError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {saveError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중…' : editingItem ? '수정' : '추가'}
            </Button>
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
