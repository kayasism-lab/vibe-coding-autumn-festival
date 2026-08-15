'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Notice = {
  _id: string
  title: string
  category: 'notice' | 'press' | 'event' | 'media'
  isPinned: boolean
  createdAt: string
}

const categoryLabels: Record<Notice['category'], string> = {
  notice: '공지',
  press: '보도자료',
  event: '이벤트',
  media: '미디어',
}

export function NoticePreview() {
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    fetch('/api/notices?limit=4')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotices(data.data.items)
      })
  }, [])

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">Notice</p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">공지사항</h2>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/notices">
              전체 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          {notices.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">등록된 공지사항이 없습니다.</div>
          ) : (
            <ul className="divide-y divide-border">
              {notices.map((notice) => (
                <li key={notice._id}>
                  <Link href={`/notices/${notice._id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {notice.isPinned && <Pin className="h-3 w-3 flex-shrink-0 text-primary" />}
                        <Badge variant="outline" className="text-xs">{categoryLabels[notice.category]}</Badge>
                      </div>
                      <h3 className="truncate text-sm font-medium text-card-foreground sm:text-base">{notice.title}</h3>
                    </div>
                    <time className="flex-shrink-0 text-xs text-muted-foreground">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
