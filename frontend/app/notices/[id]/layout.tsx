import type { Metadata } from 'next'
import { fetchNotices, toSnippet } from '@/lib/seo-data'
import { SITE_NAME } from '@/lib/seo'

/**
 * 공지·보도 상세의 제목과 본문 앞부분을 검색 결과에 그대로 노출시킨다.
 * 상세 API는 호출할 때마다 조회수를 올리므로 목록 API에서 찾아 쓴다(seo-data 참고)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const notices = await fetchNotices()
  const notice = notices.find((item) => item._id === id)

  if (!notice) {
    return {
      title: '공지사항',
      description: `${SITE_NAME}의 공지사항입니다.`,
    }
  }

  const description =
    toSnippet(notice.content) || `${SITE_NAME} 공지사항 - ${notice.title}`

  return {
    title: notice.title,
    description,
    keywords: [notice.title, '가을연극축제', '가을 연극 축제', '공지사항', '연극 축제 소식'],
    alternates: { canonical: `/notices/${id}` },
    openGraph: {
      type: 'article',
      title: `${notice.title} | ${SITE_NAME}`,
      description,
      url: `/notices/${id}`,
      publishedTime: notice.publishedAt,
      ...(notice.imageUrls?.[0] ? { images: [{ url: notice.imageUrls[0] }] } : {}),
    },
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
