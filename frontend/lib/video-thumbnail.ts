/**
 * 영상 URL에서 썸네일 후보와 재생용 임베드 주소를 뽑아내는 유틸.
 *
 * 브라우저는 외부 영상(유튜브 등)의 화면을 직접 캡처할 수 없다.
 * 그래서 "원하는 순간을 골라 캡처"하는 대신, 유튜브가 영상마다 미리 만들어 둔
 * 썸네일 주소들을 후보로 보여주고 그중에서 고르게 하는 방식을 쓴다.
 */

export type ThumbnailCandidate = {
  /** 선택 화면에 표시할 이름 */
  label: string
  url: string
}

/** 유튜브 영상 ID (11자). watch·youtu.be·embed·shorts·live 주소를 모두 지원한다 */
export function getYoutubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return match ? match[1] : null
}

/** 비메오 영상 ID (숫자) */
export function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

/**
 * 유튜브가 영상마다 자동 생성해 두는 썸네일 목록.
 * hq1~hq3은 영상을 3등분한 지점의 장면이라 "장면 고르기" 용도로 쓸 수 있다.
 * maxresdefault는 고화질이지만 없는 영상도 있어서, 화면에서 로드 실패를 걸러내야 한다.
 */
export function getYoutubeThumbnails(videoId: string): ThumbnailCandidate[] {
  const base = `https://i.ytimg.com/vi/${videoId}`
  return [
    { label: '대표 (고화질)', url: `${base}/maxresdefault.jpg` },
    { label: '대표', url: `${base}/hqdefault.jpg` },
    { label: '장면 1', url: `${base}/hq1.jpg` },
    { label: '장면 2', url: `${base}/hq2.jpg` },
    { label: '장면 3', url: `${base}/hq3.jpg` },
  ]
}

/** 비메오는 공개 oEmbed로 대표 이미지 한 장만 받을 수 있다 */
async function fetchVimeoThumbnail(url: string): Promise<ThumbnailCandidate[]> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.thumbnail_url ? [{ label: '대표', url: data.thumbnail_url }] : []
  } catch {
    // 네트워크 실패는 조용히 넘긴다. 썸네일은 직접 업로드로도 채울 수 있다
    return []
  }
}

/** 영상 주소를 받아 고를 수 있는 썸네일 후보를 돌려준다 */
export async function fetchVideoThumbnails(url: string): Promise<ThumbnailCandidate[]> {
  const trimmed = url.trim()
  if (!trimmed) return []

  const youtubeId = getYoutubeVideoId(trimmed)
  if (youtubeId) return getYoutubeThumbnails(youtubeId)

  if (getVimeoVideoId(trimmed)) return fetchVimeoThumbnail(trimmed)

  return []
}

/** 영상을 화면에서 재생하기 위한 임베드 주소. 지원하지 않는 주소면 null */
export function getVideoEmbedUrl(url: string): string | null {
  const youtubeId = getYoutubeVideoId(url)
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`

  const vimeoId = getVimeoVideoId(url)
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`

  return null
}
