'use client'

import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export type ProgramFormType = 'play' | 'short_play' | 'reading'

export interface ProgramForm {
  title: string
  type: ProgramFormType
  company: string
  runtime: number
  synopsis: string
  detailContent: string
  venue: string
  venueAddress?: string
  ageRating?: string
  isActive: boolean
  openForApplication: boolean
  order: number
  posterUrl?: string
  ticketUrl?: string
  castText: string
  galleryUrls: string[]
  pamphletUrls: string[]
  regularPrice: number
  discountPrice: number
}

export function ProgramFormDialog({
  isOpen,
  onOpenChange,
  isEditing,
  form,
  onFormChange,
  isSaving,
  onSave,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  form: ProgramForm
  onFormChange: (form: ProgramForm) => void
  isSaving: boolean
  onSave: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '프로그램 수정' : '프로그램 추가'}</DialogTitle>
          <DialogDescription>프로그램 정보를 입력하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="제목"><Input value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} /></Field>
            <Field label="유형">
              <Select value={form.type} onValueChange={(type: ProgramFormType) => onFormChange({ ...form, type })}>
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
            <Field label="극단"><Input value={form.company} onChange={(e) => onFormChange({ ...form, company: e.target.value })} /></Field>
            <Field label="공연장"><Input value={form.venue} onChange={(e) => onFormChange({ ...form, venue: e.target.value })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="공연장 주소">
              <Input
                value={form.venueAddress}
                onChange={(e) => onFormChange({ ...form, venueAddress: e.target.value })}
                placeholder="주소를 입력하면 관람안내 페이지의 위치 버튼이 활성화됩니다"
              />
            </Field>
            <Field label="관람 연령">
              <Input
                value={form.ageRating}
                onChange={(e) => onFormChange({ ...form, ageRating: e.target.value })}
                placeholder="예: 12세 이상 관람가"
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="러닝타임"><Input type="number" value={form.runtime} onChange={(e) => onFormChange({ ...form, runtime: Number(e.target.value) })} /></Field>
            <Field label="정가"><Input type="number" value={form.regularPrice} onChange={(e) => onFormChange({ ...form, regularPrice: Number(e.target.value) })} /></Field>
            <Field label="할인가"><Input type="number" value={form.discountPrice} onChange={(e) => onFormChange({ ...form, discountPrice: Number(e.target.value) })} /></Field>
          </div>
          <Field label="작품 소개"><Textarea rows={4} value={form.synopsis} onChange={(e) => onFormChange({ ...form, synopsis: e.target.value })} /></Field>
          <Field label="상세 안내글 (연출의도·관전포인트 등, 선택)">
            <Textarea
              rows={4}
              value={form.detailContent}
              onChange={(e) => onFormChange({ ...form, detailContent: e.target.value })}
              placeholder="시놉시스 외에 관객에게 전하고 싶은 이야기를 자유롭게 작성하세요."
            />
          </Field>
          <Field label="출연진"><Textarea rows={3} value={form.castText} onChange={(e) => onFormChange({ ...form, castText: e.target.value })} placeholder="줄바꿈으로 구분" /></Field>
          <Field label="포스터 이미지">
            <CloudinaryUpload
              value={form.posterUrl}
              onChange={(posterUrl) => onFormChange({ ...form, posterUrl: posterUrl as string })}
              folder="autumn_festival/programs/posters"
              placeholder="포스터 이미지 업로드"
              aspectRatio={3 / 4}
            />
          </Field>
          <Field label="예매 URL"><Input value={form.ticketUrl} onChange={(e) => onFormChange({ ...form, ticketUrl: e.target.value })} /></Field>
          <Field label="공연 갤러리 이미지">
            <CloudinaryUpload
              value={form.galleryUrls}
              onChange={(galleryUrls) => onFormChange({ ...form, galleryUrls: galleryUrls as string[] })}
              multiple
              maxFiles={12}
              folder="autumn_festival/programs/gallery"
              placeholder="공연 사진 업로드"
            />
          </Field>
          <Field label="팜플렛 이미지 (선택)">
            <CloudinaryUpload
              value={form.pamphletUrls}
              onChange={(pamphletUrls) => onFormChange({ ...form, pamphletUrls: pamphletUrls as string[] })}
              multiple
              maxFiles={12}
              folder="autumn_festival/programs/pamphlets"
              placeholder="축제 팜플렛(리플렛) 스캔 이미지 업로드"
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>공개 상태</Label>
            <Switch checked={form.isActive} onCheckedChange={(isActive) => onFormChange({ ...form, isActive })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>시민 참여 신청 받기</Label>
              <p className="text-xs text-muted-foreground">열린 낭독극/열린 단막극처럼 공개모집이 필요한 프로그램에 켜주세요.</p>
            </div>
            <Switch
              checked={form.openForApplication}
              onCheckedChange={(openForApplication) => onFormChange({ ...form, openForApplication })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onSave} disabled={isSaving}>{isEditing ? '수정' : '추가'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
