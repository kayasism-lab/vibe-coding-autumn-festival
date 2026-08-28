'use client'

import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import {
  ALL,
  GalleryFilters,
  emptyFilterState,
  type FilterOption,
  type GalleryFilterState,
} from '@/components/gallery/gallery-filters'
import { GalleryGrid } from '@/components/gallery/gallery-grid'
import { GalleryLightbox, type LightboxItem } from '@/components/gallery/gallery-lightbox'
import { GALLERY_CATEGORIES, GALLERY_TYPES, getTheaterGroupId, getTheaterGroupName } from '@/lib/gallery-taxonomy'

export default function GalleryPage() {
  const [items, setItems] = useState<LightboxItem[]>([])
  // 사진·영상을 포함해 모든 조건은 '전체'로 시작한다. 먼저 다 보여주고 좁혀가는 방식
  const [filters, setFilters] = useState<GalleryFilterState>(emptyFilterState)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.data)
      })
  }, [])

  const typeOptions: FilterOption[] = [
    { value: ALL, label: '전체' },
    ...GALLERY_TYPES.map(({ value, label }) => ({ value, label })),
  ]

  const categoryOptions: FilterOption[] = [
    { value: ALL, label: '전체' },
    ...GALLERY_CATEGORIES.map(({ value, label }) => ({ value, label })),
  ]

  // 극단·연도는 실제 등록된 자료에 있는 것만 조건으로 보여준다.
  // 고르면 아무것도 안 나오는 빈 조건을 늘어놓지 않기 위해서다
  const groupOptions: FilterOption[] = useMemo(() => {
    const found = new Map<string, string>()
    items.forEach((item) => {
      const id = getTheaterGroupId(item.theaterGroup)
      const name = getTheaterGroupName(item.theaterGroup)
      if (id && name) found.set(id, name)
    })
    return [
      { value: ALL, label: '전체' },
      ...Array.from(found, ([value, label]) => ({ value, label })).sort((a, b) =>
        a.label.localeCompare(b.label, 'ko')
      ),
    ]
  }, [items])

  const yearOptions: FilterOption[] = useMemo(() => {
    const years = Array.from(
      new Set(items.map((item) => new Date(item.createdAt).getFullYear().toString()))
    ).sort().reverse()
    return [{ value: ALL, label: '전체' }, ...years.map((year) => ({ value: year, label: year }))]
  }, [items])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const year = new Date(item.createdAt).getFullYear().toString()
        return (
          (filters.type === ALL || item.type === filters.type) &&
          (filters.category === ALL || (item.category ?? 'etc') === filters.category) &&
          (filters.group === ALL || getTheaterGroupId(item.theaterGroup) === filters.group) &&
          (filters.year === ALL || year === filters.year)
        )
      }),
    [items, filters]
  )

  const openLightbox = (item: LightboxItem) => {
    setCurrentIndex(filteredItems.findIndex((candidate) => candidate._id === item._id))
    setIsOpen(true)
  }

  // 목록 끝에서 한 번 더 넘기면 처음으로 돌아간다
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (filteredItems.length === 0) return
    setCurrentIndex((prev) => {
      const next = direction === 'prev' ? prev - 1 : prev + 1
      if (next < 0) return filteredItems.length - 1
      if (next >= filteredItems.length) return 0
      return next
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-[8.25rem]">
        <PageHeader
          hero="bulbs"
          subtitle="Gallery"
          title="갤러리"
          description="가을연극축제의 순간들을 사진과 영상으로 만나보세요."
        />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <GalleryFilters
              value={filters}
              onChange={(next) => {
                setFilters(next)
                // 조건이 바뀌면 목록 순서가 달라지므로 크게 보기를 닫는다
                setIsOpen(false)
              }}
              typeOptions={typeOptions}
              categoryOptions={categoryOptions}
              groupOptions={groupOptions}
              yearOptions={yearOptions}
              resultCount={filteredItems.length}
            />

            {filteredItems.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                {items.length === 0 ? '등록된 갤러리가 없습니다.' : '조건에 맞는 자료가 없습니다.'}
              </div>
            ) : (
              <GalleryGrid items={filteredItems} onSelect={openLightbox} />
            )}
          </div>
        </section>
      </main>
      <Footer />

      <GalleryLightbox
        item={isOpen ? filteredItems[currentIndex] ?? null : null}
        index={currentIndex}
        total={filteredItems.length}
        onClose={() => setIsOpen(false)}
        onNavigate={navigateLightbox}
      />
    </div>
  )
}
