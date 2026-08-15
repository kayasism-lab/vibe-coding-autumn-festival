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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Sponsor = {
  _id: string
  name: string
  logoUrl: string
  websiteUrl?: string
  tier: 'main' | 'gold' | 'silver' | 'partner'
  order: number
}

const emptyForm: Omit<Sponsor, '_id'> = {
  name: '',
  logoUrl: '',
  websiteUrl: '',
  tier: 'partner',
  order: 0,
}

const tierLabels = {
  main: '메인',
  gold: '골드',
  silver: '실버',
  partner: '파트너',
}

const tierColors = {
  main: 'bg-primary text-primary-foreground',
  gold: 'bg-yellow-500 text-white',
  silver: 'bg-gray-400 text-white',
  partner: 'bg-blue-500 text-white',
}

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [form, setForm] = useState<Omit<Sponsor, '_id'>>(emptyForm)

  const fetchSponsors = async () => {
    try {
      const res = await fetch('/api/sponsors')
      const data = await res.json()
      if (data.success) setSponsors(data.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSponsors()
  }, [])

  const openDialog = (sponsor?: Sponsor) => {
    setEditingSponsor(sponsor || null)
    setForm(sponsor ? {
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      websiteUrl: sponsor.websiteUrl || '',
      tier: sponsor.tier,
      order: sponsor.order,
    } : { ...emptyForm, order: sponsors.length })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(editingSponsor ? `/api/sponsors/${editingSponsor._id}` : '/api/sponsors', {
        method: editingSponsor ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          websiteUrl: form.websiteUrl || undefined,
          logoUrl: form.logoUrl || '/placeholder-logo.png',
        }),
      })
      if (res.ok) {
        await fetchSponsors()
        setIsDialogOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/sponsors/${id}`, { method: 'DELETE' })
    if (res.ok) fetchSponsors()
  }

  return (
    <div className="min-h-screen bg-muted">
      <AdminSidebar />
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">후원사 관리</h1>
              <p className="text-muted-foreground">후원사 정보를 관리합니다.</p>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              후원사 추가
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>후원사명</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead>웹사이트</TableHead>
                  <TableHead>정렬</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">불러오는 중...</TableCell></TableRow>
                ) : sponsors.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">등록된 후원사가 없습니다.</TableCell></TableRow>
                ) : sponsors.map((sponsor) => (
                  <TableRow key={sponsor._id}>
                    <TableCell className="font-medium">{sponsor.name}</TableCell>
                    <TableCell><Badge className={tierColors[sponsor.tier]}>{tierLabels[sponsor.tier]}</Badge></TableCell>
                    <TableCell>
                      {sponsor.websiteUrl ? (
                        <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                          {sponsor.websiteUrl}
                        </a>
                      ) : <span className="text-muted-foreground text-sm">없음</span>}
                    </TableCell>
                    <TableCell>{sponsor.order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(sponsor)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sponsor._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSponsor ? '후원사 수정' : '후원사 추가'}</DialogTitle>
            <DialogDescription>후원사 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="후원사명"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="등급">
              <Select value={form.tier} onValueChange={(tier: Sponsor['tier']) => setForm({ ...form, tier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">메인</SelectItem>
                  <SelectItem value="gold">골드</SelectItem>
                  <SelectItem value="silver">실버</SelectItem>
                  <SelectItem value="partner">파트너</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="웹사이트"><Input type="url" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} /></Field>
            <Field label="로고 이미지">
              <CloudinaryUpload
                value={form.logoUrl}
                onChange={(logoUrl) => setForm({ ...form, logoUrl: logoUrl as string })}
                folder="autumn_festival/sponsors"
                placeholder="후원사 로고 업로드"
                aspectRatio={16 / 9}
              />
            </Field>
            <Field label="정렬"><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>{editingSponsor ? '수정' : '추가'}</Button>
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
