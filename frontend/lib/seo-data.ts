/**
 * 서버(빌드/렌더 시점)에서 백엔드 데이터를 가져오는 SEO 전용 헬퍼.
 *
 * 브라우저에서 쓰는 fetch('/api/...')는 next.config의 rewrite가 처리해주지만,
 * 서버에서는 상대 경로를 쓸 수 없어 백엔드 주소를 직접 붙여야 한다.
 *
 * 백엔드가 꺼져 있거나 응답이 늦어도 페이지 생성 자체가 실패하면 안 되므로
 * 모든 함수는 실패 시 빈 배열/ null을 돌려준다.
 */

export interface SeoProgram {
  _id: string
  title: string
  company?: string
  synopsis?: string
  venue?: string
  posterUrl?: string
  type?: string
  updatedAt?: string
}

export interface SeoNotice {
  _id: string
  title: string
  content?: string
  category?: string
  imageUrls?: string[]
  publishedAt?: string
  updatedAt?: string
}

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000'

// 한 시간마다 다시 받아온다. 공지·프로그램은 자주 바뀌지 않아 이 정도면 충분하다
const REVALIDATE = 3600

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? null) as T | null
  } catch {
    // 백엔드가 응답하지 않아도 페이지는 기본 메타데이터로 정상 렌더된다
    return null
  }
}

/** 공개 중인 공연 프로그램 전체 (목록 API는 배열을 그대로 준다) */
export async function fetchPrograms(): Promise<SeoProgram[]> {
  const data = await getJson<SeoProgram[]>('/api/programs')
  return Array.isArray(data) ? data : []
}

/**
 * 공지·보도 전체.
 * 상세 API(/api/notices/:id)는 호출할 때마다 조회수를 1 올리므로,
 * 메타데이터를 만들 때는 조회수에 영향이 없는 목록 API를 크게 한 번 받아 쓴다.
 */
export async function fetchNotices(): Promise<SeoNotice[]> {
  const data = await getJson<{ items?: SeoNotice[] }>('/api/notices?limit=500&category=all')
  return Array.isArray(data?.items) ? data.items : []
}

/** 긴 본문을 검색 결과 스니펫 길이(약 150자)로 줄인다. HTML 태그와 줄바꿈은 제거 */
export function toSnippet(text: string | undefined, maxLength = 150): string {
  if (!text) return ''
  const plain = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain
}
