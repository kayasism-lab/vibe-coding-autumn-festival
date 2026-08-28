'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type ArticlePreview = {
  title: string
  description: string
  imageUrl: string
  publishedAt: string
  siteName: string
  url: string
}

interface ArticleLinkImportProps {
  onLoaded: (preview: ArticlePreview) => void
}

/**
 * 기사 주소를 넣으면 제목·대표 이미지·발행일을 채워주는 입력칸.
 *
 * 기사 본문은 가져오지 않는다. 본문과 사진은 언론사 저작물이라 옮겨 담으면
 * 저작권 문제가 되기 때문에, 요약은 직접 쓰고 원문으로 보내주는 방식을 쓴다.
 */
export function ArticleLinkImport({ onLoaded }: ArticleLinkImportProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadedFrom, setLoadedFrom] = useState('')

  const handleLoad = async () => {
    if (!url.trim() || isLoading) return
    setIsLoading(true)
    setError('')
    setLoadedFrom('')

    try {
      const res = await fetch('/api/notices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.message || '기사를 불러오지 못했습니다.')
        return
      }

      onLoaded(data.data)
      setLoadedFrom(data.data.siteName || '기사')
    } catch {
      setError('기사를 불러오지 못했습니다. 주소를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/40 p-3">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="기사 주소를 붙여넣으세요 (https://...)"
          // 주소를 넣고 엔터를 치는 게 자연스러워서 함께 받는다.
          // 폼 안에 있으므로 기본 동작(저장)을 막아야 한다
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleLoad()
            }
          }}
        />
        <Button type="button" onClick={handleLoad} disabled={isLoading || !url.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              불러오는 중
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              불러오기
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {loadedFrom && !error && (
        <p className="text-xs text-muted-foreground">
          {loadedFrom}에서 제목·이미지·날짜를 채웠습니다. 내용은 직접 정리해 적어주세요.
        </p>
      )}

      {!error && !loadedFrom && (
        <p className="text-xs text-muted-foreground">
          제목·대표 이미지·발행일이 자동으로 채워집니다. 기사 본문은 저작권 문제로 가져오지
          않으니, 소개글은 직접 정리해 적고 원문 링크로 안내해주세요.
        </p>
      )}
    </div>
  )
}
