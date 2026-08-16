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
  // 표시용 주관처 이름. 소유 극단을 고르면 자동으로 그 이름이 들어간다.
  company: string
  // 소유 극단 ID. 비어 있으면 협의회 직접 주관 작품으로 취급한다.
  theaterGroup: string
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

// 협의회가 직접 주관하는 작품(열린 낭독극 등)을 나타내는 선택값.
// Select는 빈 문자열을 값으로 쓸 수 없어 별도 토큰을 둔다.
const NO_GROUP = '__none__'

export function ProgramFormDialog({
  isOpen,
  onOpenChange,
  isEditing,
  form,
  onFormChange,
  isSaving,
  onSave,
  theaterGroups,
  canChangeOwner,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  form: ProgramForm
  onFormChange: (form: ProgramForm) => void
  isSaving: boolean
  onSave: () => void
  theaterGroups: { _id: string; name: string }[]
  /** 극단 담당자는 소유 극단을 바꿀 수 없으므로 false로 내려온다 */
  canChangeOwner: boolean
}) {
  const handleOwnerChange = (value: string) => {
    if (value === NO_GROUP) {
      onFormChange({ ...form, theaterGroup: '', company: '전국직장인연극단체협의회' })
      return
    }

    const group = theaterGroups.find((item) => item._id === value)
    onFormChange({ ...form, theaterGroup: value, company: group?.name ?? form.company })
  }

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
            <Field label="주관 극단">
              {canChangeOwner ? (
                <>
                  <Select value={form.theaterGroup || NO_GROUP} onValueChange={handleOwnerChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GROUP}>협의회 직접 주관</SelectItem>
                      {theaterGroups.map((group) => (
                        <SelectItem key={group._id} value={group._id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    선택한 극단의 담당자 계정이 이 작품을 수정할 수 있게 됩니다.
                  </p>
                </>
              ) : (
                // 극단 담당자는 본인 극단 작품만 다루므로 읽기 전용으로 보여준다
                <Input value={form.company} readOnly disabled />
              )}
            </Field>
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
