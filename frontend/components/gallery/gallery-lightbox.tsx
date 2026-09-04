'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Info, Play, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getProviderLabel, getVideoEmbedUrl } from '@/lib/video-thumbnail'
import {
  getGalleryCategoryLabel,
  getGalleryImages,
  getTheaterGroupName,
} from '@/lib/gallery-taxonomy'
import { toLargeUrl, toMiniUrl } from '@/lib/cloudinary-url'
import type { GalleryCategory } from '@/types'
import type { GalleryCardRatio, GalleryTheaterGroup } from '@/lib/gallery-taxonomy'

export type LightboxItem = {
  _id: string
  type: 'photo' | 'video'
  title: string
  description?: string
  category?: GalleryCategory
  url: string
  images?: string[]
  /** 목록에서 차지할 칸 모양. 크게 보기는 이와 무관하게 원래 비율로 보여준다 */
  cardRatio?: GalleryCardRatio
  thumbnailUrl?: string
  theaterGroup?: GalleryTheaterGroup
  order?: number
  createdAt: string
}

interface GalleryLightboxProps {
  item: LightboxItem | null
  onClose: () => void
}

/**
 * 사진·영상 크게 보기.
 *
 * 화살표는 '지금 보고 있는 자료 안의 사진'을 넘긴다. 다른 자료로 건너뛰지 않는다.
 * 공연 사진 다섯 장을 보다가 갑자기 다른 극단 사진이 나오면 맥락이 끊기기 때문이다.
 * 다른 자료는 창을 닫고 목록에서 고르면 된다.
 *
 * 화면을 거의 다 쓰고, 사진은 남는 자리를 채우되 원래 비율을 지킨다.
 * 예전에는 공용 Dialog의 기본 폭(sm:max-w-lg = 512px)에 눌려 큰 화면에서도
 * 좁은 칸에 갇혔고, 그보다 큰 사진은 칸 밖으로 나가 잘려 보였다.
 *
 * 설명은 사진을 가리지 않도록 아래에 놓고, 사진만 보고 싶을 때는 눌러서 접을 수 있다.
 */
export function GalleryLightbox({ item, onClose }: GalleryLightboxProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [isCaptionVisible, setIsCaptionVisible] = useState(true)

  const photos = item ? getGalleryImages(item) : []
  const hasMultiple = photos.length > 1

  // 다른 자료를 열면 첫 장부터, 접어둔 설명도 다시 펴준다
  useEffect(() => {
    setPhotoIndex(0)
    setIsCaptionVisible(true)
  }, [item?._id])

  // 사진첩을 넘기듯 좌우 키로도 넘길 수 있게 한다
  useEffect(() => {
    if (!item || !hasMultiple) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
      if (event.key === 'ArrowRight') setPhotoIndex((i) => (i + 1) % photos.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, hasMultiple, photos.length])

  const embedUrl = item && item.type === 'video' ? getVideoEmbedUrl(item.url) : null
  // 영상인데 사이트 안에서 재생할 수 없으면 원본으로 보내야 한다
  const isExternal = !!item && item.type === 'video' && !embedUrl
  const providerLabel = item ? getProviderLabel(item.url) : ''

  const groupName = getTheaterGroupName(item?.theaterGroup)
  const meta = item
    ? [
        getGalleryCategoryLabel(item.category),
        groupName,
        new Date(item.createdAt).getFullYear().toString(),
      ].filter(Boolean)
    : []

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        // 공용 Dialog의 기본값(grid·gap·좁은 max-w·세로 스크롤)을 모두 덮어써야
        // 사진이 화면을 제대로 쓴다. sm:max-w-none이 없으면 512px에 갇힌다
        className="flex h-[92dvh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden border-none bg-black/95 p-0 sm:max-w-none"
      >
        {/* Radix Dialog는 제목이 없으면 스크린리더가 창의 정체를 알릴 수 없어 콘솔 경고를 낸다.
            화면에는 사진만 보여야 하므로 sr-only로 숨겨서 넣는다 */}
        <DialogTitle className="sr-only">{item ? `${item.title} 크게 보기` : '크게 보기'}</DialogTitle>
        {item && (
          <>
            {/* 사진 자리. 남는 공간을 전부 쓰되 비율은 건드리지 않는다.
                min-h-0이 없으면 flex 자식이 내용 크기만큼 부풀어 아래가 밀려난다 */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <button
                onClick={onClose}
                aria-label="닫기"
                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>

              {hasMultiple && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    aria-label="이전 사진"
                    className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:left-4 sm:h-12 sm:w-12"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    aria-label="다음 사진"
                    className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:right-4 sm:h-12 sm:w-12"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <span className="absolute left-3 top-3 z-20 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
                    {photoIndex + 1} / {photos.length}
                  </span>
                </>
              )}

              {embedUrl ? (
                <div className="aspect-video w-full max-w-6xl">
                  <iframe
                    src={embedUrl}
                    title={item.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isExternal ? (
                // 사이트 안에서 재생할 수 없는 영상(인스타그램 등)
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link relative flex h-full w-full items-center justify-center"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={toLargeUrl(item.thumbnailUrl)}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="aspect-video w-full max-w-3xl bg-white/5" />
                  )}
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/40 transition-colors group-hover/link:bg-foreground/50">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <Play className="ml-1 h-6 w-6 text-primary" />
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
                      {providerLabel}에서 재생하기
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </a>
              ) : (
                // 가로로 긴 사진도 세로로 긴 사진도 자리에 맞춰 통째로 보이게 한다
                <button
                  type="button"
                  onClick={() => setIsCaptionVisible((prev) => !prev)}
                  aria-label={isCaptionVisible ? '설명 숨기기' : '설명 보기'}
                  className="flex h-full w-full cursor-zoom-out items-center justify-center p-2 sm:p-4"
                >
                  <img
                    src={toLargeUrl(photos[photoIndex] ?? item.url)}
                    alt={`${item.title} ${photoIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </button>
              )}
            </div>

            {/* 여러 장일 때만 아래에 늘어놓아, 몇 장인지와 어디쯤인지 한눈에 보이게 한다 */}
            {hasMultiple && (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`${index + 1}번째 사진`}
                    aria-current={index === photoIndex}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity ${
                      index === photoIndex
                        ? 'border-white'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={toMiniUrl(photo)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {isCaptionVisible ? (
              <div className="max-h-[22dvh] shrink-0 overflow-y-auto border-t border-white/10 px-5 py-4">
                <p className="font-medium text-white">{item.title}</p>
                {meta.length > 0 && (
                  <p className="mt-1 text-xs text-white/60">{meta.join(' · ')}</p>
                )}
                {item.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">
                    {item.description}
                  </p>
                )}
              </div>
            ) : (
              // 설명을 접었을 때 다시 펼 수 있는 길을 남겨둔다
              <button
                type="button"
                onClick={() => setIsCaptionVisible(true)}
                className="flex w-full shrink-0 items-center justify-center gap-1.5 border-t border-white/10 py-2.5 text-xs text-white/60 transition-colors hover:text-white"
              >
                <Info className="h-3.5 w-3.5" />
                설명 보기
              </button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
