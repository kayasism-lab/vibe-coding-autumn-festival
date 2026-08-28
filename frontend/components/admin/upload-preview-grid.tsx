'use client'

import Image from 'next/image'
import { X } from 'lucide-react'

interface UploadPreviewGridProps {
  urls: string[]
  /** 미리보기 칸의 가로세로 비율 */
  ratio: number
  multiple: boolean
  onRemove: (index: number) => void
}

/**
 * 업로드된 이미지 미리보기.
 * cloudinary-upload.tsx가 300줄 제한을 넘지 않도록 화면 표시 부분만 떼어냈다.
 */
export function UploadPreviewGrid({ urls, ratio, multiple, onRemove }: UploadPreviewGridProps) {
  if (urls.length === 0) return null

  return (
    <div
      className={`grid gap-3 mb-4 ${
        multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'
      }`}
    >
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="relative group w-full max-w-[220px] overflow-hidden rounded-md border border-border bg-muted sm:max-w-[260px]"
          style={{ aspectRatio: ratio }}
        >
          <Image src={url} alt={`업로드한 이미지 ${index + 1}`} fill className="object-cover" />
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`${index + 1}번째 이미지 삭제`}
            // 터치 화면에는 마우스를 올리는 동작이 없다. 예전처럼 hover에만 걸어두면
            // 휴대폰에서 올린 이미지를 지우지 못해 바꿀 방법이 사라진다
            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg transition-transform hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
