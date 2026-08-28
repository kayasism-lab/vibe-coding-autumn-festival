'use client'

import { Images, Play } from 'lucide-react'
import {
  getGalleryCategoryLabel,
  getGalleryImages,
  getTheaterGroupName,
} from '@/lib/gallery-taxonomy'
import { toThumbnailUrl } from '@/lib/cloudinary-url'
import type { LightboxItem } from './gallery-lightbox'

interface GalleryGridProps {
  items: LightboxItem[]
  onSelect: (item: LightboxItem) => void
}

/**
 * 갤러리 목록.
 *
 * 제목과 분류는 마우스를 올렸을 때가 아니라 늘 보이게 둔다.
 * 터치 화면에는 마우스를 올리는 동작이 없어, 예전처럼 hover에만 걸어두면
 * 휴대폰에서는 어떤 사진인지 끝내 알 수 없었다.
 */
export function GalleryGrid({ items, onSelect }: GalleryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {items.map((item) => {
        const groupName = getTheaterGroupName(item.theaterGroup)
        const photoCount = getGalleryImages(item).length
        return (
          <button
            key={item._id}
            onClick={() => onSelect(item)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* 영상은 주소가 이미지가 아니라서, 썸네일을 안 올렸으면 그림 대신 자리 표시를 둔다.
                (인스타그램처럼 썸네일을 자동으로 가져올 수 없는 곳이 있다) */}
            {item.type === 'photo' || item.thumbnailUrl ? (
              <img
                // 목록 칸 크기에 맞춰 줄인 이미지를 받는다. 원본은 그대로 보관된다
                src={toThumbnailUrl(item.thumbnailUrl || item.url)}
                alt={item.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 to-foreground/60" />
            )}
            {/* 글씨가 밝은 사진 위에서도 읽히도록 아래쪽에 어두운 층을 깐다 */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-foreground/90 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <p className="truncate font-medium text-white">{item.title}</p>
              <p className="truncate text-xs text-white/70">
                {getGalleryCategoryLabel(item.category)}
                {groupName && ` · ${groupName}`}
              </p>
            </div>

            {item.type === 'video' && (
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-0.5 h-5 w-5 text-primary" />
              </span>
            )}

            {/* 여러 장이 묶여 있다는 표시. 누르면 더 있다는 것을 미리 알린다 */}
            {photoCount > 1 && (
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                <Images className="h-3.5 w-3.5" />
                {photoCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
