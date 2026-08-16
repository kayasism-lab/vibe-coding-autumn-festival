'use client'

import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// 썸네일 그리드 + 클릭 시 이전/다음 이동이 가능한 큰 화면 보기(라이트박스).
// 팜플렛은 세로형 포스터와 가로로 긴 리플릿이 섞여 들어오므로,
// 잘라내지 않고(object-contain) 가로가 긴 이미지는 그리드에서 두 칸을 쓰게 한다.
// 모바일 핀치 줌은 layout.tsx의 viewport 설정(maximumScale)에 맡기고 별도 로직을 넣지 않는다.
export function ImageLightbox({ images, altPrefix }: { images: string[]; altPrefix: string }) {
  const [index, setIndex] = useState<number | null>(null)
  // 이미지별 가로/세로 비율 (로드된 뒤에만 알 수 있어 상태로 보관)
  const [ratios, setRatios] = useState<Record<number, number>>({})

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      setIndex((current) => {
        if (current === null) return current
        const next = direction === 'prev' ? current - 1 : current + 1
        return (next + images.length) % images.length
      })
    },
    [images.length]
  )

  // 라이트박스가 열려 있을 때 좌우 방향키로도 넘길 수 있게 한다
  useEffect(() => {
    if (index === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') navigate('prev')
      if (event.key === 'ArrowRight') navigate('next')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, navigate])

  const handleLoad = (i: number) => (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (!naturalHeight) return
    setRatios((prev) => ({ ...prev, [i]: naturalWidth / naturalHeight }))
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${altPrefix} ${i + 1} 크게 보기`}
            className={`group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              ratios[i] > 1.4 ? 'col-span-2' : ''
            }`}
          >
            <img
              src={url}
              alt={`${altPrefix} ${i + 1}`}
              onLoad={handleLoad(i)}
              className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent showCloseButton={false} className="max-w-6xl border-none bg-foreground/95 p-0">
          {index !== null && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIndex(null)}
                aria-label="닫기"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('prev')}
                    aria-label="이전 이미지"
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('next')}
                    aria-label="다음 이미지"
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
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
              {images.length > 1 && (
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  {index + 1} / {images.length}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
