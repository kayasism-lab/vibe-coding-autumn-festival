'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Pin } from 'lucide-react'

type Notice = {
  _id: string
  title: string
  category: 'notice' | 'press' | 'event' | 'media'
  isPinned: boolean
  viewCount: number
  createdAt: string
}

const categoryConfig = {
  notice: { label: '공지', className: 'bg-primary text-primary-foreground' },
  press: { label: '보도자료', className: 'bg-blue-100 text-blue-800' },
  event: { label: '이벤트', className: 'bg-green-100 text-green-800' },
  media: { label: '미디어', className: 'bg-purple-100 text-purple-800' },
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    fetch('/api/notices?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotices(data.data.items)
      })
  }, [])

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader hero="bulbs" subtitle="Notice" title="홍보게시판" description="축제 관련 공지사항과 소식을 확인하세요." />
        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full max-w-lg mx-auto grid grid-cols-5 mb-8">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="notice">공지</TabsTrigger>
                <TabsTrigger value="press">보도</TabsTrigger>
                <TabsTrigger value="event">이벤트</TabsTrigger>
                <TabsTrigger value="media">미디어</TabsTrigger>
              </TabsList>
              <TabsContent value="all"><NoticeList notices={notices} /></TabsContent>
              {(['notice', 'press', 'event', 'media'] as const).map((category) => (
                <TabsContent key={category} value={category}>
                  <NoticeList notices={notices.filter((notice) => notice.category === category)} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function NoticeList({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">등록된 게시글이 없습니다.</div>
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <ul className="divide-y divide-border">
        {notices.map((notice) => (
          <li key={notice._id}>
            <Link href={`/notices/${notice._id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {notice.isPinned && <Pin className="h-3 w-3 flex-shrink-0 text-primary" />}
                  <Badge className={categoryConfig[notice.category].className}>{categoryConfig[notice.category].label}</Badge>
                </div>
                <h3 className="truncate text-sm font-medium sm:text-base">{notice.title}</h3>
              </div>
              <div className="flex flex-shrink-0 items-center gap-4 text-xs text-muted-foreground">
                <span className="hidden items-center gap-1 sm:flex"><Eye className="h-3 w-3" />{notice.viewCount}</span>
                <time>{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
