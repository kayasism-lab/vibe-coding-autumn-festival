'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, Lock, Loader2, MessageSquare } from 'lucide-react'

type Inquiry = {
  _id: string
  title: string
  content: string
  name: string
  email?: string
  status: 'pending' | 'answered'
  isPrivate: boolean
  createdAt: string
  reply?: {
    content: string
    repliedAt: string
  }
}

const statusConfig = {
  pending: { label: '답변대기', className: 'bg-yellow-100 text-yellow-800' },
  answered: { label: '답변완료', className: 'bg-green-100 text-green-800' },
}

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/inquiries/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInquiry(data.data)
      })
      .finally(() => setIsLoading(false))
  }, [params.id])

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsVerifying(true)
    setError('')

    const response = await fetch(`/api/inquiries/${params.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const result = await response.json()

    if (!result.success) {
      setError(result.error || '비밀번호가 일치하지 않습니다.')
      setIsVerifying(false)
      return
    }

    setInquiry(result.data)
    setIsVerified(true)
    setIsVerifying(false)
  }

  if (isLoading || !inquiry) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              {isLoading ? '불러오는 중...' : '문의를 찾을 수 없습니다'}
            </h1>
            {!isLoading && (
              <Button asChild>
                <Link href="/inquiries">목록으로</Link>
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (inquiry.isPrivate && !isVerified && !inquiry.content) {
    return (
      <>
        <Header />
        <main className="pt-[8.25rem]">
          <InquiryHero inquiry={inquiry} isPrivate />
          <section className="bg-background py-12 lg:py-16">
            <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
              <Card>
                <CardHeader>
                  <CardTitle>비밀번호 확인</CardTitle>
                  <CardDescription>문의 내용을 확인하려면 비밀번호를 입력하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="비밀번호 입력"
                        required
                      />
                      {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isVerifying}>
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          확인 중...
                        </>
                      ) : (
                        '확인'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <InquiryHero inquiry={inquiry} />
        <section className="bg-background py-12 lg:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>문의 내용</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed text-card-foreground">{inquiry.content}</div>
            </div>

            {inquiry.reply && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="default">답변</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(inquiry.reply.repliedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="whitespace-pre-line leading-relaxed text-card-foreground">{inquiry.reply.content}</div>
              </div>
            )}

            <div className="mt-12 flex justify-center border-t pt-8">
              <Button asChild variant="outline">
                <Link href="/inquiries">목록으로</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function InquiryHero({ inquiry, isPrivate = false }: { inquiry: Inquiry; isPrivate?: boolean }) {
  return (
    <div className="bg-foreground py-12 text-background lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/inquiries" className="mb-6 inline-flex items-center text-sm text-background/70 hover:text-background">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Link>
        <div className="mb-4 flex items-center gap-2">
          <Badge className={statusConfig[inquiry.status].className}>{statusConfig[inquiry.status].label}</Badge>
          {(isPrivate || inquiry.isPrivate) && <Lock className="h-4 w-4" />}
        </div>
        <h1 className="text-balance text-2xl font-bold sm:text-3xl">
          {isPrivate ? '비공개 문의입니다' : inquiry.title}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-background/60">
          <span>{inquiry.name}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
    </div>
  )
}
