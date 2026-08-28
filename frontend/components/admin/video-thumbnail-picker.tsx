'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CloudinaryUpload } from './cloudinary-upload'
import {
  fetchVideoThumbnails,
  getVideoProvider,
  type ThumbnailCandidate,
} from '@/lib/video-thumbnail'

interface VideoThumbnailPickerProps {
  /** 영상 주소. 이 값이 바뀌면 후보를 다시 불러온다 */
  videoUrl: string
  value: string
  onChange: (url: string) => void
}

/**
 * 영상 주소에서 뽑아낸 썸네일 후보 중 하나를 고르게 하는 화면.
 * 마음에 드는 후보가 없을 때를 대비해 직접 업로드도 함께 제공한다.
 */
export function VideoThumbnailPicker({ videoUrl, value, onChange }: VideoThumbnailPickerProps) {
  const [candidates, setCandidates] = useState<ThumbnailCandidate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // 유튜브는 없는 썸네일도 주소는 만들어지므로, 실제로 그려지지 않은 것만 걸러낸다
  const [brokenUrls, setBrokenUrls] = useState<string[]>([])

  useEffect(() => {
    const trimmed = videoUrl.trim()
    if (!trimmed) {
      setCandidates([])
      return
    }

    // 주소를 고치는 도중 이전 요청의 결과가 뒤늦게 덮어쓰는 것을 막는다
    let isCurrent = true
    setIsLoading(true)
    setBrokenUrls([])

    fetchVideoThumbnails(trimmed)
      .then((result) => {
        if (!isCurrent) return
        setCandidates(result)
        // 아직 고른 썸네일이 없으면 항상 존재하는 기본 이미지를 미리 선택해 준다.
        // 비워두면 공개 화면에서 영상 주소를 이미지로 그리려다 깨진다
        if (!value && result.length > 0) {
          onChange(result.find((item) => item.label === '대표')?.url ?? result[0].url)
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
    // value·onChange는 의도적으로 제외한다. 썸네일을 고를 때마다 후보를 다시 부르면 안 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl])

  const markBroken = (url: string) => setBrokenUrls((prev) => [...prev, url])
  const visibleCandidates = candidates.filter((item) => !brokenUrls.includes(item.url))
  // 후보 중에서 고른 값을 업로드 칸에 넘기면 "이미 올린 이미지"로 잡혀 업로드 버튼이 사라진다.
  // 직접 올린 이미지일 때만 넘겨서 미리보기·삭제가 되게 한다
  const customThumbnail = value && !candidates.some((item) => item.url === value) ? value : ''
  const provider = getVideoProvider(videoUrl.trim())

  return (
    <div className="space-y-3">
      {isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          영상에서 썸네일을 찾는 중...
        </p>
      )}

      {!isLoading && visibleCandidates.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            영상에서 가져온 이미지입니다. 하나를 골라주세요.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visibleCandidates.map((item) => (
              <button
                key={item.url}
                type="button"
                onClick={() => onChange(item.url)}
                className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                  value === item.url ? 'border-primary' : 'border-transparent hover:border-primary/40'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.label}
                  className="aspect-video w-full bg-muted object-cover"
                  onError={() => markBroken(item.url)}
                  onLoad={(e) => {
                    // 유튜브는 고화질 썸네일이 없을 때 120px짜리 회색 이미지를 대신 준다
                    if (e.currentTarget.naturalWidth <= 120) markBroken(item.url)
                  }}
                />
                <span className="absolute inset-x-0 bottom-0 bg-foreground/70 px-2 py-1 text-xs text-white">
                  {item.label}
                </span>
                {value === item.url && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {!isLoading && videoUrl.trim() && visibleCandidates.length === 0 && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          {provider === 'instagram'
            ? '인스타그램 영상은 사이트 안에서 재생할 수 없어, 눌렀을 때 인스타그램으로 연결됩니다. 썸네일도 자동으로 가져올 수 없으니 대표 이미지를 아래에서 꼭 올려주세요 (없으면 빈 화면이 보입니다).'
            : '이 영상 주소에서는 썸네일을 자동으로 가져올 수 없습니다. 아래에서 직접 지정해주세요.'}
        </p>
      )}

      {/* 유튜브·비메오가 아닌 영상은 자동 후보가 없으므로 직접 지정할 길을 항상 열어둔다.
          이미 올려둔 이미지가 있으면 주소만 붙여넣고, 없으면 파일로 올린다 */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-sm text-muted-foreground">이미지 주소 직접 입력</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... (이미지 주소를 붙여넣기)"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">파일로 직접 올리기</Label>
        <CloudinaryUpload
          value={customThumbnail}
          onChange={(url) => onChange(url as string)}
          folder="autumn_festival/gallery/thumbnails"
          placeholder="썸네일 이미지 업로드"
        />
      </div>
    </div>
  )
}
