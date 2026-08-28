'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sortGalleryLatestFirst } from '@/lib/gallery-taxonomy'
import { toThumbnailUrl } from '@/lib/cloudinary-url'

type GalleryItem = {
  _id: string
  title: string
  type: 'photo' | 'video'
  url: string
  thumbnailUrl?: string
  order?: number
  createdAt: string
}

const categories = [
  { key: 'all', label: '전체' },
  { key: 'photo', label: '사진' },
  { key: 'video', label: '영상' },
]

export function GalleryPreview() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [items, setItems] = useState<GalleryItem[]>([])

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        // 여기서 미리 자르지 않는다. 사진·영상 탭을 고른 뒤에 잘라야
        // "영상만 보기"에서 앞쪽 몇 개 안에 든 영상만 나오는 일이 없다
        if (data.success) setItems(sortGalleryLatestFirst(data.data))
      })
  }, [])

  const filteredItems = useMemo(
    () => (activeCategory === 'all' ? items : items.filter((item) => item.type === activeCategory)),
    [activeCategory, items]
  )

  const shownItems = filteredItems.slice(0, 6)
  // 4장 이상일 때만 첫 칸을 크게 쓰는 잡지식 배치를 쓴다
  const isFeatureLayout = shownItems.length >= 4

  return (
    <section className="bg-foreground py-16 text-background lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Gallery</p>
            <h2 className="text-2xl font-bold sm:text-3xl">MEDIA 갤러리</h2>
          </div>
          <Link href="/gallery" className="flex items-center gap-1 text-sm text-background/70 hover:text-background">
            더보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === category.key
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-background/10 text-background/70 hover:bg-background/20 hover:text-background'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-background/10 bg-background/10 p-10 text-center text-background/70">등록된 갤러리가 없습니다.</div>
        ) : (
          <div className={cn('grid grid-cols-2 gap-4', shownItems.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
            {shownItems.map((item, index) => (
              <Link
                key={item._id}
                href="/gallery"
                className={cn(
                  'group relative aspect-[4/3] overflow-hidden rounded-xl',
                  // 첫 칸을 크게 쓰는 배치는 자료가 넉넉할 때만 쓴다.
                  // 몇 장 없을 때 쓰면 옆자리가 비어 오히려 허전해 보인다
                  index === 0 && isFeatureLayout && 'md:col-span-2 md:row-span-2 md:aspect-square'
                )}
              >
                <img src={toThumbnailUrl(item.thumbnailUrl || item.url)} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                {item.type === 'video' && (
                  <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80">
                    <Play className="h-4 w-4 fill-foreground text-foreground" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-4">
                  <p className="line-clamp-1 text-sm font-medium text-background">{item.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
