'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'

interface Application {
  _id: string
  programId: { _id: string; title: string }
  name: string
  email: string
  region: { sido: string; gu: string }
  motivation: string
  experience?: string
  status: ApplicationStatus
  adminNote?: string
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: '심사중', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '승인', className: 'bg-green-100 text-green-800' },
  rejected: { label: '반려', className: 'bg-red-100 text-red-800' },
}

export default function ApplyStatusPage() {
  const [lookupForm, setLookupForm] = useState({ phone: '', password: '' })
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState({ email: '', sido: '', gu: '', motivation: '', experience: '' })
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
        sido: app.region.sido,
        gu: app.region.gu,
        motivation: app.motivation,
        experience: app.experience || '',
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
        region: { sido: editForm.sido, gu: editForm.gu },
        motivation: editForm.motivation,
        experience: editForm.experience,
      }),
    })
    const data = await res.json()

    setMessage(data.success ? '수정되었습니다.' : data.error || '수정에 실패했습니다.')
    setIsSaving(false)
  }

  return (
    <>
      <Header />
      <main className="pt-[9.5rem]">
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
                    <Field label="전화번호">
                      <Input
                        required
                        type="tel"
                        placeholder="010-0000-0000"
                        value={lookupForm.phone}
                        onChange={(e) => setLookupForm({ ...lookupForm, phone: e.target.value })}
                      />
                    </Field>
                    <Field label="비밀번호">
                      <Input
                        required
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
                      <p className="text-sm text-muted-foreground">신청 프로그램</p>
                      <p className="font-semibold text-foreground">{application.programId.title}</p>
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
                      <Field label="시/도">
                        <Input value={editForm.sido} onChange={(e) => setEditForm({ ...editForm, sido: e.target.value })} />
                      </Field>
                      <Field label="구">
                        <Input value={editForm.gu} onChange={(e) => setEditForm({ ...editForm, gu: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="신청 계기">
                      <Textarea
                        rows={4}
                        value={editForm.motivation}
                        onChange={(e) => setEditForm({ ...editForm, motivation: e.target.value })}
                      />
                    </Field>
                    <Field label="관련 경력">
                      <Textarea
                        rows={3}
                        value={editForm.experience}
                        onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
