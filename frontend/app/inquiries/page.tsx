'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, MessageSquare, PenLine } from 'lucide-react'

type Inquiry = {
  _id: string
  title: string
  name: string
  status: 'pending' | 'answered'
  isPrivate: boolean
  createdAt: string
}

const statusConfig = {
  pending: { label: '답변대기', className: 'bg-yellow-100 text-yellow-800' },
  answered: { label: '답변완료', className: 'bg-green-100 text-green-800' },
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inquiries/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInquiries(data.data.items)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader subtitle="Inquiry" title="문의하기" description="축제에 관해 궁금한 점이 있으시면 문의해주세요." />
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex justify-end">
              <Button asChild>
                <Link href="/inquiries/new">
                  <PenLine className="mr-2 h-4 w-4" />
                  문의 작성
                </Link>
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              {isLoading ? (
                <div className="p-10 text-center text-muted-foreground">불러오는 중...</div>
              ) : inquiries.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">등록된 문의가 없습니다.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {inquiries.map((inquiry) => (
                    <li key={inquiry._id}>
                      <Link href={`/inquiries/${inquiry._id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge className={statusConfig[inquiry.status].className}>
                              {statusConfig[inquiry.status].label}
                            </Badge>
                            {inquiry.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <h3 className="truncate text-sm font-medium text-card-foreground sm:text-base">
                            {inquiry.isPrivate ? '비공개 문의입니다' : inquiry.title}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">{inquiry.name}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-4">
                          <time className="text-xs text-muted-foreground">
                            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                          </time>
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-8 rounded-xl bg-muted p-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">문의 안내</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- 문의에 대한 답변은 1~2일 내로 등록됩니다.</li>
                <li>- 비공개 문의는 작성 시 입력한 비밀번호로 확인하실 수 있습니다.</li>
                <li>- 답변이 등록되면 입력하신 이메일로 알림을 보내드립니다.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
