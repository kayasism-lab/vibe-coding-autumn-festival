'use client'

import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * 이미지 크게 보기 창.
 *
 * 팜플렛 그리드와 작품 상세의 포스터가 함께 쓴다. 여러 장이면 좌우로 넘길 수 있고,
 * 한 장이면 화살표와 쪽번호를 숨긴다.
 *
 * index가 null이면 닫힌 상태다. 여는 쪽에서 번호를 넘겨 제어한다.
 */
export function LightboxViewer({
  images,
  index,
  altPrefix,
  onIndexChange,
  onClose,
}: {
  images: string[]
  /** 지금 보고 있는 이미지 번호. null이면 창이 닫혀 있다 */
  index: number | null
  altPrefix: string
  onIndexChange: (next: number) => void
  onClose: () => void
}) {
  const hasMultiple = images.length > 1

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (index === null || !hasMultiple) return
      const next = direction === 'prev' ? index - 1 : index + 1
      onIndexChange((next + images.length) % images.length)
    },
    [index, hasMultiple, images.length, onIndexChange]
  )

  // 창이 열려 있을 때 좌우 방향키로도 넘길 수 있게 한다
  useEffect(() => {
    if (index === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') navigate('prev')
      if (event.key === 'ArrowRight') navigate('next')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, navigate])

  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        // 공용 Dialog의 기본값(grid·gap·좁은 max-w·안쪽 여백)을 모두 덮어써야
        // 이미지가 화면을 제대로 쓴다. sm:max-w-none이 없으면 큰 화면에서 512px에 갇힌다
        className="flex h-[92dvh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden border-none bg-black/95 p-0 sm:max-w-none"
      >
        {/* 화면에는 안 보이고 스크린리더만 읽는 제목.
            없으면 Radix가 접근성 경고를 띄운다 */}
        <DialogTitle className="sr-only">{altPrefix} 크게 보기</DialogTitle>

        {index !== null && (
          // 남는 공간을 전부 쓰되 비율은 건드리지 않는다.
          // min-h-0이 없으면 flex 자식이 내용 크기만큼 부풀어 창 밖으로 넘친다
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('prev')}
                  aria-label="이전 이미지"
                  className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:left-4 sm:h-12 sm:w-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('next')}
                  aria-label="다음 이미지"
                  className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:right-4 sm:h-12 sm:w-12"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <span className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
                  {index + 1} / {images.length}
                </span>
              </>
            )}

            <img
              src={images[index]}
              alt={`${altPrefix} ${index + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// 썸네일 그리드 + 클릭 시 크게 보기.
// 팜플렛은 세로형 포스터와 가로로 긴 리플릿이 섞여 들어오므로,
// 잘라내지 않고(object-contain) 가로가 긴 이미지는 그리드에서 두 칸을 쓰게 한다.
//
// 크게 보기는 넓은 화면에서만 연다. 휴대폰에서는 화면에서 바로 손가락으로 확대하면 되고
// (썸네일이 원본 주소를 그대로 쓰므로 확대해도 화질이 그대로다),
// 크게 보기 창은 position:fixed라 확대하는 동안 화면이 떨린다.
export function ImageLightbox({ images, altPrefix }: { images: string[]; altPrefix: string }) {
  const [index, setIndex] = useState<number | null>(null)
  // 이미지별 가로/세로 비율 (로드된 뒤에만 알 수 있어 상태로 보관)
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const isMobile = useIsMobile()

  const handleLoad = (i: number) => (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (!naturalHeight) return
    setRatios((prev) => ({ ...prev, [i]: naturalWidth / naturalHeight }))
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((url, i) => {
          const cellClass = `group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted ${
            ratios[i] > 1.4 ? 'col-span-2' : ''
          }`
          const thumbnail = (
            <img
              src={url}
              alt={`${altPrefix} ${i + 1}`}
              onLoad={handleLoad(i)}
              className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02]"
            />
          )

          // 휴대폰에서는 누를 것이 없는 그냥 사진으로 둔다
          return isMobile ? (
            <div key={url} className={cellClass}>
              {thumbnail}
            </div>
          ) : (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${altPrefix} ${i + 1} 크게 보기`}
              className={`${cellClass} transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              {thumbnail}
            </button>
          )
        })}
      </div>

      <LightboxViewer
        images={images}
        index={index}
        altPrefix={altPrefix}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
      />
    </>
  )
}
