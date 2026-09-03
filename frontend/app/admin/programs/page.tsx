'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAdminAccount } from '@/lib/use-admin-account'
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
import { CENTER_FOCUS } from '@/lib/image-focus'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { programTypeAccountLabel } from '@/lib/program-type-account'

type Program = {
  _id: string
  title: string
  type: 'play' | 'short_play' | 'reading'
  company: string
  theaterGroup?: string | null
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
  posterFocus?: { x: number; y: number }
  ticketUrl?: string
  cast: string[]
  galleryUrls: string[]
  pamphletUrls?: string[]
  price: { regular: number; discount?: number }
}

const emptyForm: ProgramForm = {
  title: '',
  type: 'play',
  company: '전국직장인연극단체협의회',
  theaterGroup: '',
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
  posterFocus: CENTER_FOCUS,
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
  // 저장에 실패한 사유. 값이 있으면 창을 닫지 않고 그대로 보여준다
  const [saveError, setSaveError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [form, setForm] = useState<ProgramForm>(emptyForm)
  const [theaterGroups, setTheaterGroups] = useState<{ _id: string; name: string }[]>([])
  // 극단 담당자면 본인 극단 작품만, 낭독극·단막극 담당자면 담당 유형의(소유 극단 없는) 작품만
  // 다루도록 화면을 제한한다
  const { isGroupAccount, theaterGroup: myGroupId, programType: myProgramType } = useAdminAccount()

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

    fetch('/api/theater-groups')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTheaterGroups(data.data.map((g: { _id: string; name: string }) => ({ _id: g._id, name: g.name })))
        }
      })
      .catch(() => {})
  }, [])

  // 담당 극단이 있으면 그 극단 작품만, 없으면(낭독극·단막극 담당자) 소유 극단이 없고
  // 유형이 같은 작품만 내 것으로 본다
  const isOwnedProgram = (program: Program) => {
    if (myGroupId) return program.theaterGroup === myGroupId
    if (myProgramType) return !program.theaterGroup && program.type === myProgramType
    return false
  }

  const filteredPrograms = programs
    // 극단 담당자에게는 본인 담당 작품만 노출한다 (수정 권한도 백엔드에서 동일하게 막힌다)
    .filter((program) => !isGroupAccount || isOwnedProgram(program))
    .filter((program) =>
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
            theaterGroup: program.theaterGroup || '',
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
            // 예전에 등록한 작품은 이 값이 없어 가운데로 본다 (지금까지의 모습 그대로)
            posterFocus: program.posterFocus || CENTER_FOCUS,
            ticketUrl: program.ticketUrl || '',
            castText: program.cast.join('\n'),
            galleryUrls: program.galleryUrls,
            pamphletUrls: program.pamphletUrls || [],
            regularPrice: program.price?.regular || 0,
            discountPrice: program.price?.discount || 0,
          }
        : {
            ...emptyForm,
            order: programs.length,
            // 극단 담당자가 새 작품을 만들면 본인 극단으로, 낭독극·단막극 담당자는
            // 소유 극단 없이 본인 담당 유형으로 미리 채워둔다
            ...(isGroupAccount && myGroupId
              ? {
                  theaterGroup: myGroupId,
                  company: theaterGroups.find((group) => group._id === myGroupId)?.name ?? '',
                }
              : isGroupAccount && myProgramType
                ? {
                    type: myProgramType,
                    theaterGroup: '',
                    company: programTypeAccountLabel(myProgramType),
                  }
                : {}),
          }
    )
    setSaveError('')
    setIsDialogOpen(true)
  }

  const toPayload = () => ({
    title: form.title,
    type: form.type,
    company: form.company,
    theaterGroup: form.theaterGroup || null,
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
    // 포스터가 없으면 위치도 의미가 없다
    posterFocus: form.posterUrl ? (form.posterFocus ?? CENTER_FOCUS) : undefined,
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
    setSaveError('')
    try {
      const res = await adminFetch(editingProgram ? `/api/programs/${editingProgram._id}` : '/api/programs', {
        method: editingProgram ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload()),
      })
      if (res.ok) {
        await fetchPrograms()
        setIsDialogOpen(false)
        return
      }

      // 실패했으면 창을 닫지 않는다. 입력한 내용을 다시 쓰지 않아도 되도록
      setSaveError(await getErrorMessage(res))
    } catch {
      setSaveError('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await adminFetch(`/api/programs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchPrograms()
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
              <h1 className="text-2xl font-bold text-foreground">
                {isGroupAccount ? '작품 관리' : '프로그램 관리'}
              </h1>
              <p className="text-muted-foreground">
                {isGroupAccount
                  ? '우리 극단의 작품 정보를 등록하고 수정합니다.'
                  : '공연 프로그램을 관리합니다.'}
              </p>
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
                      {/* 작품 삭제는 관리자만 가능 (백엔드도 동일하게 제한) */}
                      {!isGroupAccount && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(program._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
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
        saveError={saveError}
        onSave={handleSave}
        theaterGroups={theaterGroups}
        canChangeOwner={!isGroupAccount}
        // 낭독극·단막극 담당자는 작품 유형을 담당 유형에서 바꿀 수 없다 (백엔드도 동일하게 막는다)
        canChangeType={!(isGroupAccount && !!myProgramType)}
      />
    </div>
  )
}
