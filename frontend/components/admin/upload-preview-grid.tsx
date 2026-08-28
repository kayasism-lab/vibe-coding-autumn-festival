'use client'

import Image from 'next/image'
import { Star, X } from 'lucide-react'

interface UploadPreviewGridProps {
  urls: string[]
  /** 미리보기 칸의 가로세로 비율 */
  ratio: number
  multiple: boolean
  onRemove: (index: number) => void
  /**
   * 대표로 고른 사진의 순번. 목록에 보일 한 장이며, 주면 대표 선택 기능이 켜진다.
   * 갤러리처럼 여러 장을 묶는 곳에서만 쓴다.
   */
  coverIndex?: number
  onSelectCover?: (index: number) => void
}

/**
 * 업로드된 이미지 미리보기.
 * cloudinary-upload.tsx가 길어지지 않도록 화면 표시 부분만 떼어냈다.
 */
export function UploadPreviewGrid({
  urls,
  ratio,
  multiple,
  onRemove,
  coverIndex,
  onSelectCover,
}: UploadPreviewGridProps) {
  if (urls.length === 0) return null

  const canPickCover = !!onSelectCover && urls.length > 1

  return (
    <div className="mb-4">
      {canPickCover && (
        // 여러 장을 올리면 어느 것이 목록에 보일지 알기 어렵다. 먼저 알려준다
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          목록에 보일 <b className="font-semibold text-foreground">대표 사진을 골라주세요.</b>
          사진 위의 별을 누르면 바뀝니다. (기본은 첫 번째 사진)
        </p>
      )}

      <div
        className={`grid gap-3 ${
          multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'
        }`}
      >
        {urls.map((url, index) => {
          const isCover = canPickCover && index === coverIndex
          return (
            <div
              key={`${url}-${index}`}
              className={`relative w-full max-w-[220px] overflow-hidden rounded-md border-2 bg-muted sm:max-w-[260px] ${
                isCover ? 'border-primary' : 'border-border'
              }`}
              style={{ aspectRatio: ratio }}
            >
              <Image src={url} alt={`업로드한 이미지 ${index + 1}`} fill className="object-cover" />

              {canPickCover && (
                <button
                  type="button"
                  onClick={() => onSelectCover?.(index)}
                  aria-label={isCover ? '지금 대표 사진입니다' : `${index + 1}번째 사진을 대표로`}
                  aria-pressed={isCover}
                  className={`absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow-lg transition-colors ${
                    isCover
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${isCover ? 'fill-current' : ''}`} />
                  {isCover ? '대표' : '대표로'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`${index + 1}번째 이미지 삭제`}
                // 터치 화면에는 마우스를 올리는 동작이 없다. 예전처럼 hover에만 걸어두면
                // 휴대폰에서 올린 이미지를 지우지 못해 바꿀 방법이 사라진다
                className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-lg transition-transform hover:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
