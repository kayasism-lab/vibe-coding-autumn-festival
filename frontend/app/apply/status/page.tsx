'use client'

import { useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import { Field, RadioOption } from '@/components/citizen-application-fields'
import { CitizenQuestionFields } from '@/components/citizen-question-fields'
import { CitizenApplicationQna, type QnaEntry } from '@/components/citizen-application-qna'
import { formatPhoneInput } from '@/lib/phone'
import {
  resolveCitizenQuestions,
  toCitizenAnswers,
  validateCitizenAnswers,
  type CitizenAnswers,
  type CitizenApplicationFormConfig,
} from '@/lib/citizen-application-questions'

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
  // 2026-09-06 신청서에서 뺀 항목. 그전에 접수된 신청서에만 값이 있다
  practiceAvailable?: boolean
  // 아래 항목은 기본 질문의 답이 저장되는 자리. 담당자가 질문을 지웠으면 값이 없을 수 있다
  unavailableSchedules?: string[]
  respectAgreement?: boolean
  hasExperience?: boolean
  experienceDetail?: string
  motivation?: string
  // 담당자가 만든 질문의 답 전체. 질문 구성이 자유로워지기 전 신청서에는 없다
  answers?: CitizenAnswers
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
  // 수정 화면에 그릴 질문 구성 (작품 정보에서 받아온다)
  const [formConfig, setFormConfig] = useState<CitizenApplicationFormConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState({
    email: '',
    residence: '',
    age: '',
    gender: 'male' as 'male' | 'female',
  })
  // 질문 항목의 답. 조회한 신청서 값으로 채운다
  const [answers, setAnswers] = useState<CitizenAnswers>({})
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 신청 화면과 같은 질문을 같은 순서로 보여준다
  const questions = useMemo(() => resolveCitizenQuestions(formConfig), [formConfig])

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
      // 질문 구성은 작품 정보에 들어 있어, 수정 화면을 그리려면 따로 받아와야 한다.
      // 답변은 질문 구성이 정해진 뒤에 채워야 새로 추가된 질문의 빈 칸까지 함께 나온다.
      // 실패해도 나머지 수정은 되어야 하므로 조회 자체는 막지 않는다
      const applyConfig = (config: CitizenApplicationFormConfig | null) => {
        setFormConfig(config)
        setAnswers(toCitizenAnswers(resolveCitizenQuestions(config), app))
      }
      fetch(`/api/programs?type=${app.programType}`)
        .then((res) => res.json())
        .then((programData) => {
          applyConfig(programData.success ? (programData.data?.[0]?.applicationForm ?? null) : null)
        })
        .catch(() => applyConfig(null))
      setEditForm({
        email: app.email,
        residence: app.residence,
        age: String(app.age),
        gender: app.gender,
      })
    } else {
      setError(data.error || '조회에 실패했습니다.')
    }
    setIsLoading(false)
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!application) return

    // 접수 때와 같은 규칙으로 필수 항목을 먼저 확인한다
    const answerError = validateCitizenAnswers(questions, answers)
    if (answerError) {
      setMessage(answerError)
      return
    }

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
        answers,
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

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="actor"
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
                        {programTypeLabel[application.programType]}
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
                    {/* 담당자가 작품 관리 화면에서 만든 질문들 */}
                    <CitizenQuestionFields
                      questions={questions}
                      answers={answers}
                      onChange={setAnswers}
                      idPrefix="edit"
                    />
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
