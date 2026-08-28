'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryPaginationProps {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}

/**
 * 페이지가 많아져도 번호 줄이 길어지지 않도록 앞뒤와 현재 주변만 남기고 줄인다.
 * 예) 1 … 4 [5] 6 … 12
 */
function getPageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result: (number | 'gap')[] = []
  sorted.forEach((page, index) => {
    // 앞 번호와 2 이상 떨어져 있으면 사이를 생략 표시로 메운다
    if (index > 0 && page - (sorted[index - 1] as number) > 1) result.push('gap')
    result.push(page)
  })
  return result
}

export function GalleryPagination({ currentPage, totalPages, onChange }: GalleryPaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="갤러리 페이지 이동">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, index) =>
        page === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            aria-label={`${page}페이지`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`h-9 min-w-9 rounded-full border px-3 text-sm transition-colors ${
              page === currentPage
                ? 'border-primary bg-primary font-medium text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
