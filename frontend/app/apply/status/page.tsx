'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import { Field, RadioOption, YesNoField } from '@/components/citizen-application-fields'
import { CitizenApplicationQna, type QnaEntry } from '@/components/citizen-application-qna'
import { formatPhoneInput } from '@/lib/phone'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'
type ProgramType = 'reading' | 'short_play'

interface Application {
  _id: string
  programId: { _id: string; title: string }
  programType: ProgramType
  name: string
  email: string
  residence: string
  age: number
  gender: 'male' | 'female'
  practiceAvailable: boolean
  respectAgreement: boolean
  hasExperience: boolean
  experienceDetail?: string
  motivation: string
  status: ApplicationStatus
  adminNote?: string
  qna: QnaEntry[]
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: '심사중', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '승인', className: 'bg-green-100 text-green-800' },
  rejected: { label: '반려', className: 'bg-red-100 text-red-800' },
}

const programTypeLabel: Record<ProgramType, string> = {
  reading: '열린 낭독극',
  short_play: '열린 단막극',
}

export default function ApplyStatusPage() {
  const [lookupForm, setLookupForm] = useState({ phone: '', password: '' })
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState({
    email: '',
    residence: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    practiceAvailable: true,
    respectAgreement: true,
    hasExperience: false,
    experienceDetail: '',
    motivation: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const res = await fetch('/api/citizen-applications/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lookupForm),
    })
    const data = await res.json()

    if (data.success) {
      const app: Application = data.data
      setApplication(app)
      setEditForm({
        email: app.email,
        residence: app.residence,
        age: String(app.age),
        gender: app.gender,
        practiceAvailable: app.practiceAvailable,
        respectAgreement: app.respectAgreement,
        hasExperience: app.hasExperience,
        experienceDetail: app.experienceDetail || '',
        motivation: app.motivation,
      })
    } else {
      setError(data.error || '조회에 실패했습니다.')
    }
    setIsLoading(false)
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!application) return
    setIsSaving(true)
    setMessage('')

    const res = await fetch(`/api/citizen-applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: lookupForm.password,
        email: editForm.email,
        residence: editForm.residence,
        age: Number(editForm.age),
        gender: editForm.gender,
        practiceAvailable: editForm.practiceAvailable,
        respectAgreement: editForm.respectAgreement,
        hasExperience: editForm.hasExperience,
        experienceDetail: editForm.hasExperience ? editForm.experienceDetail : undefined,
        motivation: editForm.motivation,
      }),
    })
    const data = await res.json()

    setMessage(data.success ? '수정되었습니다.' : data.error || '수정에 실패했습니다.')
    setIsSaving(false)
  }

  const handleQnaReply = async (text: string): Promise<string | void> => {
    if (!application) return '신청 내역을 먼저 조회해주세요.'
    const res = await fetch(`/api/citizen-applications/${application._id}/qna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: lookupForm.password, message: text }),
    })
    const data = await res.json()
    if (!data.success) return data.error || '문의 등록에 실패했습니다.'
    setApplication(data.data)
  }

  const practiceLabel = application
    ? application.programType === 'reading'
      ? '주 2회 연습 가능'
      : '주 3회 연습 가능'
    : ''
  const practiceQuestionLabel = application
    ? application.programType === 'reading'
      ? '주 2회 연습이 가능하신가요?'
      : '주 3회 연습이 가능하신가요?'
    : ''

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          subtitle="Join"
          title="신청 내역 조회"
          description="전화번호와 비밀번호로 시민 참여 신청 내역을 확인하고 수정할 수 있습니다."
        />

        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            {!application ? (
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleLookup} className="space-y-4">
                    <Field label="전화번호(숫자만 입력)">
                      <Input
                        required
                        type="tel"
                        placeholder="010-0000-0000"
                        value={lookupForm.phone}
                        onChange={(e) => setLookupForm({ ...lookupForm, phone: formatPhoneInput(e.target.value) })}
                      />
                    </Field>
                    <Field label="비밀번호 (4자 이상, 문자/특수문자 가능)">
                      <Input
                        required
                        minLength={4}
                        type="password"
                        value={lookupForm.password}
                        onChange={(e) => setLookupForm({ ...lookupForm, password: e.target.value })}
                      />
                    </Field>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      조회하기
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">신청 구분</p>
                      <p className="font-semibold text-foreground">
                        {programTypeLabel[application.programType]} · {practiceLabel}
                      </p>
                    </div>
                    <Badge className={statusConfig[application.status].className}>
                      {statusConfig[application.status].label}
                    </Badge>
                  </div>

                  {application.adminNote && (
                    <div className="rounded-lg border bg-muted p-4 text-sm">
                      <p className="mb-1 font-medium text-foreground">담당자 메모</p>
                      <p className="text-muted-foreground">{application.adminNote}</p>
                    </div>
                  )}

                  <CitizenApplicationQna
                    qna={application.qna}
                    canReply={application.status === 'pending'}
                    replyingAs="applicant"
                    onSubmit={handleQnaReply}
                  />

                  <form onSubmit={handleUpdate} className="space-y-4 border-t pt-6">
                    <Field label="이름">
                      <Input value={application.name} disabled />
                    </Field>
                    <Field label="이메일">
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="사는곳">
                        <Input value={editForm.residence} onChange={(e) => setEditForm({ ...editForm, residence: e.target.value })} />
                      </Field>
                      <Field label="나이">
                        <Input type="number" min={1} value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="성별">
                      <RadioGroup value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value as 'male' | 'female' })} className="flex gap-6">
                        <RadioOption value="male" id="edit-gender-male" label="남성" />
                        <RadioOption value="female" id="edit-gender-female" label="여성" />
                      </RadioGroup>
                    </Field>
                    <YesNoField
                      label={practiceQuestionLabel}
                      value={editForm.practiceAvailable}
                      onChange={(value) => setEditForm({ ...editForm, practiceAvailable: value })}
                      name="edit-practice"
                    />
                    <YesNoField
                      label="함께하는 강사 및 동료분을 존중해주는 자세가 필요합니다."
                      value={editForm.respectAgreement}
                      onChange={(value) => setEditForm({ ...editForm, respectAgreement: value })}
                      name="edit-respect"
                    />
                    <YesNoField
                      label="연극 관련 경험이 있으신가요?"
                      value={editForm.hasExperience}
                      onChange={(value) => setEditForm({ ...editForm, hasExperience: value })}
                      name="edit-experience"
                    />
                    {editForm.hasExperience && (
                      <Field label="어떤 경험이 있으신가요? (1000자 이내)">
                        <Textarea
                          rows={3}
                          maxLength={1000}
                          value={editForm.experienceDetail}
                          onChange={(e) => setEditForm({ ...editForm, experienceDetail: e.target.value })}
                        />
                      </Field>
                    )}
                    <Field label="신청동기 및 각오">
                      <Textarea
                        rows={4}
                        value={editForm.motivation}
                        onChange={(e) => setEditForm({ ...editForm, motivation: e.target.value })}
                      />
                    </Field>
                    {message && <p className="text-sm text-primary">{message}</p>}
                    <Button type="submit" className="w-full" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      수정 저장
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
