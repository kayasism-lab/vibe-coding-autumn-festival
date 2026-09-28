'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, Loader2, Mail, MapPin, Phone, X } from 'lucide-react'
import { CitizenApplicationQna, type QnaEntry } from '@/components/citizen-application-qna'
import { CitizenApplicationAnswers } from '@/components/admin/citizen-application-answers'
import type { AnsweredQuestion, CitizenAnswers } from '@/lib/citizen-application-questions'

type Status = 'pending' | 'approved' | 'rejected'
type ProgramType = 'reading' | 'short_play'

export interface CitizenApplication {
  _id: string
  programId: { _id: string; title: string }
  programType: ProgramType
  name: string
  phone: string
  email: string
  residence: string
  age: number
  gender: 'male' | 'female'
  // 2026-09-06 신청서에서 뺀 항목. 그전에 접수된 신청서에만 값이 있다
  practiceAvailable?: boolean
  // 아래 항목은 기본 질문의 답이 저장되는 자리. 담당자가 질문을 지웠으면 값이 없을 수 있다
  unavailableSchedules?: string[]
  respectAgreement?: boolean
  hasExperience?: boolean
  experienceDetail?: string
  motivation?: string
  // 담당자가 만든 질문의 답과, 접수 당시의 질문 문구 스냅샷
  answers?: CitizenAnswers
  answeredQuestions?: AnsweredQuestion[]
  status: Status
  adminNote?: string
  qna: QnaEntry[]
  createdAt: string
}

const statusLabels: Record<Status, { label: string; color: string }> = {
  pending: { label: '심사중', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' },
}

const programTypeLabels: Record<ProgramType, string> = {
  reading: '열린 낭독극',
  short_play: '열린 단막극',
}

const genderLabels: Record<'male' | 'female', string> = {
  male: '남성',
  female: '여성',
}

const yesNo = (value: boolean) => (value ? '예' : '아니오')

export function CitizenApplicationDetailDialog({
  selected,
  isOpen,
  onOpenChange,
  adminNote,
  onAdminNoteChange,
  isUpdating,
  saveError,
  onUpdateStatus,
  onQnaSubmit,
  canDecide,
}: {
  selected: CitizenApplication | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  adminNote: string
  onAdminNoteChange: (value: string) => void
  isUpdating: boolean
  /** 심사 결과 저장에 실패한 사유. 있으면 승인·반려 버튼 위에 보여준다 */
  saveError: string
  onUpdateStatus: (status: 'approved' | 'rejected') => void
  onQnaSubmit: (message: string) => Promise<string | void>
  /** 승인·반려·관리자 메모는 총괄 관리자만 다룰 수 있다. false면 열람과 문의 답변만 보여준다 */
  canDecide: boolean
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        {selected && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selected.name}</DialogTitle>
                <Badge className={statusLabels[selected.status].color}>{statusLabels[selected.status].label}</Badge>
              </div>
              <DialogDescription>
                {programTypeLabels[selected.programType]} · {new Date(selected.createdAt).toLocaleString('ko-KR')} 신청
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selected.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selected.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {selected.residence}
                </div>
                <div className="text-sm">
                  {selected.age}세 · {genderLabels[selected.gender]}
                </div>
              </div>

              {/* 연습 참여 항목은 신청서에서 뺐지만, 그전에 받은 신청서에는 값이 남아 있어 있을 때만 보여준다 */}
              {typeof selected.practiceAvailable === 'boolean' && (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {selected.programType === 'reading' ? '주 2회 연습 가능' : '주 3회 연습 가능'}
                  </p>
                  <p className="font-medium">{yesNo(selected.practiceAvailable)}</p>
                </div>
              )}

              {/* 담당자가 만든 질문과 답. 신청 당시의 질문 문구를 그대로 따라 그린다 */}
              <CitizenApplicationAnswers application={selected} />

              <CitizenApplicationQna
                qna={selected.qna}
                canReply={selected.status === 'pending'}
                replyingAs="admin"
                onSubmit={onQnaSubmit}
              />

              {canDecide && (
                <>
                  <div className="space-y-2">
                    <Label>관리자 메모</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => onAdminNoteChange(e.target.value)}
                      placeholder="심사 관련 메모를 작성하세요..."
                      rows={3}
                    />
                  </div>

                  {saveError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {saveError}
                    </p>
                  )}

                  {selected.status === 'pending' && (
                    <div className="flex gap-3 border-t pt-4">
                      <Button
                        onClick={() => onUpdateStatus('approved')}
                        disabled={isUpdating}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" />승인</>}
                      </Button>
                      <Button onClick={() => onUpdateStatus('rejected')} disabled={isUpdating} variant="destructive" className="flex-1">
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="mr-2 h-4 w-4" />반려</>}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
