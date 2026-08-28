'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, ExternalLink, Eye } from 'lucide-react'

type Notice = {
  _id: string
  title: string
  content: string
  category: 'notice' | 'press' | 'event' | 'media'
  imageUrls?: string[]
  viewCount: number
  publishedAt?: string
  sourceUrl?: string
  sourceName?: string
  createdAt: string
}

const categoryConfig = {
  notice: { label: '공지', className: 'bg-primary text-primary-foreground' },
  press: { label: '보도자료', className: 'bg-blue-100 text-blue-800' },
  event: { label: '이벤트', className: 'bg-green-100 text-green-800' },
  media: { label: '미디어', className: 'bg-purple-100 text-purple-800' },
}

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/notices/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotice(data.data)
      })
      .finally(() => setIsLoading(false))
  }, [params.id])

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <div className="bg-foreground py-12 text-background lg:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Link href="/notices" className="mb-6 inline-flex items-center text-sm text-background/70 hover:text-background">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
            {isLoading && <p className="text-background/70">불러오는 중...</p>}
            {!isLoading && !notice && <h1 className="text-2xl font-bold">게시글을 찾을 수 없습니다.</h1>}
            {notice && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Badge className={categoryConfig[notice.category].className}>
                    {categoryConfig[notice.category].label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">{notice.title}</h1>
                <div className="mt-4 flex items-center gap-4 text-sm text-background/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(notice.publishedAt ?? notice.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {notice.viewCount}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {notice && (
          <section className="bg-background py-12 lg:py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              {notice.imageUrls && notice.imageUrls.length > 0 && (
                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {notice.imageUrls.map((url) => (
                    <div key={url} className="aspect-video overflow-hidden rounded-lg bg-muted">
                      <img src={url} alt={notice.title} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <article className="whitespace-pre-line leading-relaxed text-card-foreground">{notice.content}</article>

              {/* 기사 본문은 언론사 저작물이라 옮겨 담지 않는다. 원문으로 보내주는 것이 원칙 */}
              {notice.sourceUrl && (
                <div className="mt-8 rounded-lg border bg-muted/40 p-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    이 소식은 {notice.sourceName || '언론'}에 보도된 내용입니다.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <a href={notice.sourceUrl} target="_blank" rel="noopener noreferrer">
                      원문 기사 보기
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              )}

              <div className="mt-12 flex justify-center border-t pt-8">
                <Button asChild variant="outline">
                  {/* 보도자료는 보도·미디어 게시판으로 돌아간다 */}
                  <Link
                    href={
                      notice.category === 'press' || notice.category === 'media'
                        ? '/press'
                        : '/notices'
                    }
                  >
                    목록으로
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
