'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ProgramFormDialog, type ProgramForm } from '@/components/admin/program-form-dialog'

type Program = {
  _id: string
  title: string
  type: 'play' | 'short_play' | 'reading'
  company: string
  runtime: number
  synopsis: string
  detailContent?: string
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
  pamphletUrls?: string[]
  price: { regular: number; discount?: number }
}

const emptyForm: ProgramForm = {
  title: '',
  type: 'play',
  company: '',
  runtime: 90,
  synopsis: '',
  detailContent: '',
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
  pamphletUrls: [],
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
            detailContent: program.detailContent || '',
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
            pamphletUrls: program.pamphletUrls || [],
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
    detailContent: form.detailContent || undefined,
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
    pamphletUrls: form.pamphletUrls,
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
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
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

      <ProgramFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingProgram}
        form={form}
        onFormChange={setForm}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  )
}
