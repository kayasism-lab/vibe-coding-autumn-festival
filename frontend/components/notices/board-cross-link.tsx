'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  NOTICE_CATEGORY_LABELS,
  formatNoticeDate,
  toCategoryParam,
  type NoticeCategory,
} from '@/lib/notice-board'

type Notice = {
  _id: string
  title: string
  category: NoticeCategory
  publishedAt?: string
  createdAt: string
  sourceName?: string
}

interface BoardCrossLinkProps {
  /** 함께 보여줄 다른 게시판이 담는 종류 */
  categories: NoticeCategory[]
  heading: string
  description: string
  /** 그 게시판 주소 */
  href: string
  linkLabel: string
}

/**
 * 게시판 아래에 다른 게시판의 최근 글을 몇 건 보여준다.
 *
 * 공지사항과 보도·미디어를 나눠 놓으니 한쪽만 보고 나가면 다른 쪽이 있는 줄 모른다.
 * 목록을 섞지 않고 구분된 자리에 따로 두어, 겹쳐 보이지 않으면서 오갈 수 있게 한다.
 */
export function BoardCrossLink({
  categories,
  heading,
  description,
  href,
  linkLabel,
}: BoardCrossLinkProps) {
  const [items, setItems] = useState<Notice[]>([])

  useEffect(() => {
    fetch(`/api/notices?category=${toCategoryParam(categories)}&limit=4`)
      .then((res) => res.json())
      .then((data) => setItems(data.success ? data.data.items : []))
      // 곁들여 보여주는 자리라 실패하면 조용히 비운다
      .catch(() => setItems([]))
    // categories는 페이지마다 고정된 값이라 다시 부를 일이 없다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (items.length === 0) return null

  return (
    <section className="border-t bg-muted/30 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{heading}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Link
            href={href}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {linkLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((notice) => (
            <Link
              key={notice._id}
              href={`/notices/${notice._id}`}
              className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {NOTICE_CATEGORY_LABELS[notice.category]}
                </Badge>
                {notice.sourceName && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    {notice.sourceName}
                  </span>
                )}
              </div>
              <h3 className="mb-2 line-clamp-2 text-sm font-medium text-card-foreground">
                {notice.title}
              </h3>
              <time className="text-xs text-muted-foreground">{formatNoticeDate(notice)}</time>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
