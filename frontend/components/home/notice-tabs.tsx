'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  NOTICE_BOARD_CATEGORIES,
  PRESS_BOARD_CATEGORIES,
  formatNoticeDate,
  getNoticeCategoryLabel,
  toCategoryParam,
  type NoticeCategory,
} from '@/lib/notice-board'

type Notice = {
  _id: string
  title: string
  category: NoticeCategory
  isPinned: boolean
  publishedAt?: string
  createdAt: string
}

/**
 * 홈 아래쪽의 공지·보도 영역.
 *
 * 예전에는 왼쪽이 '전체'를 보여줘서 오른쪽 보도·미디어와 같은 글이 두 번 나왔다.
 * 이제 양쪽이 각자 맡은 종류만 서버에서 따로 받아온다.
 */
export function NoticeTabs() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [pressItems, setPressItems] = useState<Notice[]>([])

  useEffect(() => {
    const load = (categories: NoticeCategory[], limit: number) =>
      fetch(`/api/notices?category=${toCategoryParam(categories)}&limit=${limit}`)
        .then((res) => res.json())
        .then((data) => (data.success ? data.data.items : []))
        .catch(() => [])

    load(NOTICE_BOARD_CATEGORIES, 5).then(setNotices)
    load(PRESS_BOARD_CATEGORIES, 3).then(setPressItems)
  }, [])

  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">공지사항</h2>
              <Link
                href="/notices"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                더보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {notices.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                등록된 공지사항이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notices.map((notice) => (
                  <li key={notice._id}>
                    <Link
                      href={`/notices/${notice._id}`}
                      className="-mx-2 flex items-center gap-3 rounded px-2 py-3 transition-colors hover:bg-muted/50"
                    >
                      {notice.isPinned && <Pin className="h-3 w-3 flex-shrink-0 text-primary" />}
                      <span className="flex-1 truncate text-sm text-foreground">{notice.title}</span>
                      <time className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatNoticeDate(notice)}
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
              <Link
                href="/press"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                더보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              {pressItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  등록된 소식이 없습니다.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {pressItems.map((notice) => (
                    <li key={notice._id}>
                      <Link
                        href={`/notices/${notice._id}`}
                        className="block p-4 transition-colors hover:bg-muted/50"
                      >
                        <Badge variant="outline" className="mb-2 text-xs">
                          {getNoticeCategoryLabel(notice.category)}
                        </Badge>
                        <h3 className="mb-2 line-clamp-2 text-sm font-medium text-card-foreground">
                          {notice.title}
                        </h3>
                        <time className="text-xs text-muted-foreground">
                          {formatNoticeDate(notice)}
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
