'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { GalleryPagination } from '@/components/gallery/gallery-pagination'
import { GalleryLightbox, type LightboxItem } from '@/components/gallery/gallery-lightbox'
import {
  GALLERY_CATEGORIES,
  GALLERY_TYPES,
  getTheaterGroupId,
  getTheaterGroupName,
  sortGalleryLatestFirst,
} from '@/lib/gallery-taxonomy'

/** 한 장에 보여줄 개수 (3열 기준 네 줄) */
const ITEMS_PER_PAGE = 12

export default function GalleryPage() {
  const [items, setItems] = useState<LightboxItem[]>([])
  // 사진·영상을 포함해 모든 조건은 '전체'로 시작한다. 먼저 다 보여주고 좁혀가는 방식
  const [filters, setFilters] = useState<GalleryFilterState>(emptyFilterState)
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<LightboxItem | null>(null)
  const gridTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        // 최신이 앞에 오도록 화면에서도 한 번 더 맞춰둔다
        if (data.success) setItems(sortGalleryLatestFirst(data.data))
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

  // 한 화면에 너무 많이 깔리지 않도록 나눠 보여준다 (3열 기준 네 줄)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const pageItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // 조건을 바꾸면 결과가 달라지므로 첫 장으로 돌린다.
  // 안 그러면 3페이지를 보던 중 조건을 바꿨을 때 빈 화면이 나온다
  useEffect(() => {
    setPage(1)
  }, [filters])

  const changePage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages))
    setSelectedItem(null)
    // 페이지를 넘기면 목록 맨 위부터 보게 한다
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 크게 보기는 고른 자료 하나만 다룬다. 그 안의 사진 넘기기는 창이 알아서 한다
  const openLightbox = (item: LightboxItem) => setSelectedItem(item)

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
            {/* 페이지를 넘겼을 때 되돌아올 기준점 */}
            <div ref={gridTopRef} className="scroll-mt-36" />
            <GalleryFilters
              value={filters}
              onChange={(next) => {
                setFilters(next)
                // 조건이 바뀌면 목록 순서가 달라지므로 크게 보기를 닫는다
                setSelectedItem(null)
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
              <>
                <GalleryGrid items={pageItems} onSelect={openLightbox} />
                <GalleryPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onChange={changePage}
                />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <GalleryLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
