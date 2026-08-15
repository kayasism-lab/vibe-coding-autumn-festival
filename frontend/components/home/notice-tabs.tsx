'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Notice = {
  _id: string
  title: string
  category: 'notice' | 'press' | 'event' | 'media'
  isPinned: boolean
  createdAt: string
}

const tabs = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지' },
  { key: 'press', label: '보도자료' },
  { key: 'event', label: '이벤트' },
  { key: 'media', label: '미디어' },
]

const categoryLabels: Record<Notice['category'], string> = {
  notice: '공지',
  press: '보도자료',
  event: '이벤트',
  media: '미디어',
}

export function NoticeTabs() {
  const [activeTab, setActiveTab] = useState('all')
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    fetch('/api/notices?limit=8')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotices(data.data.items)
      })
  }, [])

  const filteredNotices = useMemo(
    () => (activeTab === 'all' ? notices : notices.filter((notice) => notice.category === activeTab)),
    [activeTab, notices]
  )
  const sideNotices = notices.filter((notice) => notice.category === 'press' || notice.category === 'media').slice(0, 3)

  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">공지사항</h2>
              <Link href="/notices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                더보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === tab.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            {filteredNotices.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">등록된 공지사항이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredNotices.slice(0, 5).map((notice) => (
                  <li key={notice._id}>
                    <Link href={`/notices/${notice._id}`} className="-mx-2 flex items-center gap-3 rounded px-2 py-3 transition-colors hover:bg-muted/50">
                      {notice.isPinned && <Pin className="h-3 w-3 flex-shrink-0 text-primary" />}
                      <span className="flex-1 truncate text-sm text-foreground">{notice.title}</span>
                      <time className="flex-shrink-0 text-xs text-muted-foreground">
                        {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">보도 · 미디어</h2>
              <Link href="/notices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                더보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              {sideNotices.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">등록된 소식이 없습니다.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {sideNotices.map((notice) => (
                    <li key={notice._id}>
                      <Link href={`/notices/${notice._id}`} className="block p-4 transition-colors hover:bg-muted/50">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {categoryLabels[notice.category]}
                        </Badge>
                        <h3 className="mb-2 line-clamp-2 text-sm font-medium text-card-foreground">{notice.title}</h3>
                        <time className="text-xs text-muted-foreground">
                          {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
