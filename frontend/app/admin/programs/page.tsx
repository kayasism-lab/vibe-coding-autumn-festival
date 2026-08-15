'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

type Program = {
  _id: string
  title: string
  type: 'play' | 'short_play' | 'reading'
  company: string
  runtime: number
  synopsis: string
  venue: string
  venueAddress?: string
  ageRating?: string
  isActive: boolean
  openForApplication: boolean
  order: number
  posterUrl?: string
  ticketUrl?: string
  cast: string[]
  galleryUrls: string[]
  price: { regular: number; discount?: number }
}

type ProgramForm = Omit<Program, '_id' | 'cast' | 'galleryUrls' | 'price'> & {
  castText: string
  galleryUrls: string[]
  regularPrice: number
  discountPrice: number
}

const emptyForm: ProgramForm = {
  title: '',
  type: 'play',
  company: '',
  runtime: 90,
  synopsis: '',
  venue: '',
  venueAddress: '',
  ageRating: '',
  isActive: true,
  openForApplication: false,
  order: 0,
  posterUrl: '',
  ticketUrl: '',
  castText: '',
  galleryUrls: [],
  regularPrice: 0,
  discountPrice: 0,
}

const typeLabels = {
  play: '연극',
  short_play: '단막극',
  reading: '낭독극',
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [form, setForm] = useState<ProgramForm>(emptyForm)

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs?active=false')
      const data = await res.json()
      if (data.success) setPrograms(data.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  const filteredPrograms = programs.filter((program) =>
    `${program.title} ${program.company}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openDialog = (program?: Program) => {
    setEditingProgram(program || null)
    setForm(
      program
        ? {
            title: program.title,
            type: program.type,
            company: program.company,
            runtime: program.runtime,
            synopsis: program.synopsis,
            venue: program.venue,
            venueAddress: program.venueAddress || '',
            ageRating: program.ageRating || '',
            isActive: program.isActive,
            openForApplication: program.openForApplication,
            order: program.order,
            posterUrl: program.posterUrl || '',
            ticketUrl: program.ticketUrl || '',
            castText: program.cast.join('\n'),
            galleryUrls: program.galleryUrls,
            regularPrice: program.price?.regular || 0,
            discountPrice: program.price?.discount || 0,
          }
        : { ...emptyForm, order: programs.length }
    )
    setIsDialogOpen(true)
  }

  const toPayload = () => ({
    title: form.title,
    type: form.type,
    company: form.company,
    runtime: form.runtime,
    synopsis: form.synopsis,
    venue: form.venue,
    venueAddress: form.venueAddress || undefined,
    ageRating: form.ageRating || undefined,
    isActive: form.isActive,
    openForApplication: form.openForApplication,
    order: form.order,
    posterUrl: form.posterUrl || undefined,
    ticketUrl: form.ticketUrl || undefined,
    cast: form.castText.split('\n').map((item) => item.trim()).filter(Boolean),
    galleryUrls: form.galleryUrls,
    price: {
      regular: form.regularPrice,
      ...(form.discountPrice > 0 ? { discount: form.discountPrice } : {}),
    },
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(editingProgram ? `/api/programs/${editingProgram._id}` : '/api/programs', {
        method: editingProgram ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload()),
      })
      if (res.ok) {
        await fetchPrograms()
        setIsDialogOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' })
    if (res.ok) fetchPrograms()
  }

  return (
    <div className="min-h-screen bg-muted">
      <AdminSidebar />
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">프로그램 관리</h1>
              <p className="text-muted-foreground">공연 프로그램을 관리합니다.</p>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              프로그램 추가
            </Button>
          </div>

          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="프로그램 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>극단</TableHead>
                  <TableHead>공연장</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">불러오는 중...</TableCell></TableRow>
                ) : filteredPrograms.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">등록된 프로그램이 없습니다.</TableCell></TableRow>
                ) : filteredPrograms.map((program) => (
                  <TableRow key={program._id}>
                    <TableCell className="font-medium">{program.title}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabels[program.type]}</Badge></TableCell>
                    <TableCell>{program.company}</TableCell>
                    <TableCell>{program.venue}</TableCell>
                    <TableCell><Badge variant={program.isActive ? 'default' : 'secondary'}>{program.isActive ? '공개' : '비공개'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(program)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(program._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? '프로그램 수정' : '프로그램 추가'}</DialogTitle>
            <DialogDescription>프로그램 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="제목"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="유형">
                <Select value={form.type} onValueChange={(type: Program['type']) => setForm({ ...form, type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="play">연극</SelectItem>
                    <SelectItem value="short_play">단막극</SelectItem>
                    <SelectItem value="reading">낭독극</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="극단"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
              <Field label="공연장"><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="공연장 주소">
                <Input
                  value={form.venueAddress}
                  onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
                  placeholder="주소를 입력하면 관람안내 페이지의 위치 버튼이 활성화됩니다"
                />
              </Field>
              <Field label="관람 연령">
                <Input
                  value={form.ageRating}
                  onChange={(e) => setForm({ ...form, ageRating: e.target.value })}
                  placeholder="예: 12세 이상 관람가"
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="러닝타임"><Input type="number" value={form.runtime} onChange={(e) => setForm({ ...form, runtime: Number(e.target.value) })} /></Field>
              <Field label="정가"><Input type="number" value={form.regularPrice} onChange={(e) => setForm({ ...form, regularPrice: Number(e.target.value) })} /></Field>
              <Field label="할인가"><Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: Number(e.target.value) })} /></Field>
            </div>
            <Field label="작품 소개"><Textarea rows={4} value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} /></Field>
            <Field label="출연진"><Textarea rows={3} value={form.castText} onChange={(e) => setForm({ ...form, castText: e.target.value })} placeholder="줄바꿈으로 구분" /></Field>
            <Field label="포스터 이미지">
              <CloudinaryUpload
                value={form.posterUrl}
                onChange={(posterUrl) => setForm({ ...form, posterUrl: posterUrl as string })}
                folder="autumn_festival/programs/posters"
                placeholder="포스터 이미지 업로드"
                aspectRatio={3 / 4}
              />
            </Field>
            <Field label="예매 URL"><Input value={form.ticketUrl} onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })} /></Field>
            <Field label="갤러리 이미지">
              <CloudinaryUpload
                value={form.galleryUrls}
                onChange={(galleryUrls) => setForm({ ...form, galleryUrls: galleryUrls as string[] })}
                multiple
                maxFiles={12}
                folder="autumn_festival/programs/gallery"
                placeholder="프로그램 갤러리 이미지 업로드"
              />
            </Field>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>공개 상태</Label>
              <Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>시민 참여 신청 받기</Label>
                <p className="text-xs text-muted-foreground">열린 낭독극/열린 단막극처럼 공개모집이 필요한 프로그램에 켜주세요.</p>
              </div>
              <Switch
                checked={form.openForApplication}
                onCheckedChange={(openForApplication) => setForm({ ...form, openForApplication })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>{editingProgram ? '수정' : '추가'}</Button>
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
