'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// 썸네일 그리드 + 클릭 시 이전/다음 이동이 가능한 큰 화면 보기(라이트박스).
// 모바일 핀치 줌은 layout.tsx의 viewport 설정(maximumScale)에 맡기고 별도 로직을 넣지 않는다.
export function ImageLightbox({
  images,
  altPrefix,
  aspectClassName = 'aspect-[3/4]',
}: {
  images: string[]
  altPrefix: string
  aspectClassName?: string
}) {
  const [index, setIndex] = useState<number | null>(null)

  const navigate = (direction: 'prev' | 'next') => {
    if (index === null) return
    const next = direction === 'prev' ? index - 1 : index + 1
    setIndex((next + images.length) % images.length)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setIndex(i)}
            className={`${aspectClassName} overflow-hidden rounded-md bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <img src={url} alt={`${altPrefix} ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent showCloseButton={false} className="max-w-4xl border-none bg-foreground/95 p-0">
          {index !== null && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIndex(null)}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('prev')}
                    className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('next')}
                    className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <img
                src={images[index]}
                alt={`${altPrefix} ${index + 1}`}
                className="max-h-[85vh] w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
