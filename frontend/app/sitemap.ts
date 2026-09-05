import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { fetchPrograms, fetchNotices } from '@/lib/seo-data'

// 하루에 한 번 다시 만들어 새 공지·프로그램이 사이트맵에 반영되게 한다
export const revalidate = 86400

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency']

// 검색에 노출할 정적 페이지 목록.
// priority는 "이 사이트 안에서의 상대적 중요도"로, 홈이 1.0이다
const staticRoutes: Array<{ path: string; priority: number; freq: ChangeFreq }> = [
  { path: '', priority: 1.0, freq: 'daily' },
  { path: '/about', priority: 0.9, freq: 'monthly' },
  { path: '/programs', priority: 0.9, freq: 'weekly' },
  { path: '/schedule', priority: 0.9, freq: 'weekly' },
  { path: '/tickets', priority: 0.8, freq: 'weekly' },
  { path: '/apply/citizen', priority: 0.8, freq: 'weekly' },
  { path: '/apply', priority: 0.6, freq: 'monthly' },
  { path: '/venues', priority: 0.7, freq: 'monthly' },
  { path: '/gallery', priority: 0.7, freq: 'weekly' },
  { path: '/notices', priority: 0.7, freq: 'daily' },
  { path: '/press', priority: 0.6, freq: 'weekly' },
  { path: '/community', priority: 0.5, freq: 'weekly' },
  { path: '/inquiries', priority: 0.4, freq: 'weekly' },
  { path: '/sponsors', priority: 0.5, freq: 'monthly' },
  { path: '/contact', priority: 0.6, freq: 'monthly' },
  { path: '/privacy', priority: 0.2, freq: 'yearly' },
  { path: '/terms', priority: 0.2, freq: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.freq,
    priority: route.priority,
  }))

  // 작품 상세·공지 상세도 개별 주소로 검색에 걸리도록 함께 넣는다.
  // 백엔드가 응답하지 않으면 빈 배열이 와서 정적 페이지만 제출된다
  const [programs, notices] = await Promise.all([fetchPrograms(), fetchNotices()])

  for (const program of programs) {
    entries.push({
      url: `${SITE_URL}/programs/${program._id}`,
      lastModified: program.updatedAt ? new Date(program.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const notice of notices) {
    entries.push({
      url: `${SITE_URL}/notices/${notice._id}`,
      lastModified: notice.updatedAt ? new Date(notice.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return entries
}
