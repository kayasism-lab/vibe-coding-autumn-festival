'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  NOTICE_CATEGORY_LABELS,
  formatNoticeDate,
  getCurrentKstYear,
  toCategoryParam,
  type NoticeCategory,
} from '@/lib/notice-board'

type Notice = {
  _id: string
  title: string
  category: NoticeCategory
  isPinned: boolean
  viewCount: number
  publishedAt?: string
  createdAt: string
}

const categoryStyles: Record<NoticeCategory, string> = {
  notice: 'bg-primary text-primary-foreground',
  event: 'bg-green-100 text-green-800',
  press: 'bg-blue-100 text-blue-800',
  media: 'bg-purple-100 text-purple-800',
}

interface NoticeBoardProps {
  /** 이 게시판이 담는 종류 */
  categories: NoticeCategory[]
  emptyMessage: string
}

/**
 * 공지사항 게시판과 보도·미디어 게시판이 함께 쓰는 목록.
 *
 * 담는 종류만 다르고 화면 구성은 같아서 하나로 쓴다.
 * 예전 보도까지 쌓이면 연도로 좁혀 볼 수 있어야 해서 연도 선택을 함께 둔다.
 */
export function NoticeBoard({ categories, emptyMessage }: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const categoryParam = toCategoryParam(categories)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams({ category: categoryParam, limit: '100' })
    if (selectedYear !== 'all') params.set('year', selectedYear)

    fetch(`/api/notices?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return
        setNotices(data.data.items)
        // 연도 목록은 어느 해를 고르든 그대로여야 해서 서버가 분류 기준으로 내려준다
        if (Array.isArray(data.data.years)) setYears(data.data.years)
      })
      .catch(() => setNotices([]))
      .finally(() => setIsLoading(false))
  }, [categoryParam, selectedYear])

  // 서버가 내려준 연도 목록으로 '이전 자료가 있는지'만 판단한다
  const currentYear = getCurrentKstYear()
  const hasOlderItems = years.some((year) => year < currentYear)

  const visibleNotices = useMemo(
    () =>
      selectedCategory === 'all'
        ? notices
        : notices.filter((notice) => notice.category === selectedCategory),
    [notices, selectedCategory]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* 한 게시판이 두 종류를 담을 때만 종류 선택을 보여준다 */}
        {categories.length > 1 && (
          <div className="flex gap-1.5">
            {[{ key: 'all', label: '전체' }, ...categories.map((c) => ({ key: c, label: NOTICE_CATEGORY_LABELS[c] }))].map(
              (item) => (
                <Button
                  key={item.key}
                  size="sm"
                  variant={selectedCategory === item.key ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(item.key)}
                >
                  {item.label}
                </Button>
              )
            )}
          </div>
        )}

        {/* 연도는 올해와 그 이전 두 갈래로만 나눈다. 해가 바뀌면 저절로 따라간다.
            예전 자료가 하나도 없으면 굳이 보여주지 않는다 */}
        {hasOlderItems && (
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: '전체' },
              { key: String(currentYear), label: `${currentYear}년` },
              { key: 'before', label: `${currentYear}년 이전` },
            ].map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={selectedYear === item.key ? 'default' : 'outline'}
                onClick={() => setSelectedYear(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">불러오는 중...</div>
      ) : visibleNotices.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y divide-border">
            {visibleNotices.map((notice) => (
              <li key={notice._id}>
                <Link
                  href={`/notices/${notice._id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {notice.isPinned && <Pin className="h-3 w-3 flex-shrink-0 text-primary" />}
                      <Badge className={categoryStyles[notice.category]}>
                        {NOTICE_CATEGORY_LABELS[notice.category]}
                      </Badge>
                    </div>
                    <h3 className="truncate text-sm font-medium sm:text-base">{notice.title}</h3>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4 text-xs text-muted-foreground">
                    <span className="hidden items-center gap-1 sm:flex">
                      <Eye className="h-3 w-3" />
                      {notice.viewCount}
                    </span>
                    <time>{formatNoticeDate(notice)}</time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
