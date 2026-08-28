'use client'

import { AlertCircle, CheckCircle2, ExternalLink, Info } from 'lucide-react'
import { getVideoProvider } from '@/lib/video-thumbnail'

/**
 * 영상 주소 칸 아래에 붙는 안내.
 *
 * 어디 주소를 넣을 수 있는지, 넣은 주소가 사이트 안에서 재생되는지 아니면
 * 원본으로 연결되는지를 미리 알려준다. 등록해 보고 나서야 아는 일이 없도록.
 */
export function VideoUrlHint({ url }: { url: string }) {
  const trimmed = url.trim()

  // 아직 주소를 넣기 전: 어떤 곳을 지원하는지 먼저 알려준다
  if (!trimmed) {
    return (
      <div className="flex gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="space-y-0.5">
          <p>
            <span className="font-medium text-foreground">유튜브 · 비메오</span> — 사이트 안에서
            바로 재생되고, 썸네일도 자동으로 가져옵니다.
          </p>
          <p>
            <span className="font-medium text-foreground">인스타그램</span> (릴스·게시물) — 사이트
            안에서는 재생할 수 없어, 썸네일을 직접 올리면 눌렀을 때 인스타그램으로 연결됩니다.
          </p>
        </div>
      </div>
    )
  }

  const provider = getVideoProvider(trimmed)

  if (provider === 'instagram') {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium text-foreground">인스타그램</span>으로 인식했습니다. 사이트
          안에서는 재생되지 않고 <strong className="font-medium">눌렀을 때 인스타그램으로 연결</strong>
          됩니다. 아래에서 썸네일을 꼭 올려주세요.
        </span>
      </p>
    )
  }

  if (provider) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          <span className="font-medium text-foreground">
            {provider === 'youtube' ? '유튜브' : '비메오'}
          </span>
          로 인식했습니다. 사이트 안에서 바로 재생됩니다.
        </span>
      </p>
    )
  }

  return (
    <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        인식할 수 없는 주소입니다. 유튜브·비메오·인스타그램 주소를 넣어주세요. 이대로 저장하면
        영상이 재생되지 않습니다.
      </span>
    </p>
  )
}
