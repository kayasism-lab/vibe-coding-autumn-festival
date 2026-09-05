import type { Metadata } from 'next'
import { fetchPrograms, toSnippet } from '@/lib/seo-data'
import { SITE_NAME } from '@/lib/seo'

/**
 * 작품 상세는 페이지가 'use client'라 제목을 직접 넣을 수 없다.
 * 여기서 작품명·극단명을 미리 읽어 검색 결과에 실제 작품 제목이 뜨게 한다.
 * (예: "봄날은 간다 | 극단 아해 - 2026 가을연극축제")
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const programs = await fetchPrograms()
  const program = programs.find((item) => item._id === id)

  // 백엔드를 못 읽었거나 없는 작품이면 일반적인 제목으로 되돌린다
  if (!program) {
    return {
      title: '공연 상세',
      description: `${SITE_NAME}의 공연 작품 상세 정보입니다.`,
    }
  }

  const company = program.company ? `${program.company} · ` : ''
  const description =
    toSnippet(program.synopsis) ||
    `${company}${program.title} — ${SITE_NAME}에서 무료로 만나는 공연입니다.`

  return {
    title: `${program.title}${program.company ? ` | ${program.company}` : ''}`,
    description,
    keywords: [
      program.title,
      `${program.title} 연극`,
      program.company || '',
      '가을연극축제',
      '가을 연극 축제',
      '직장인연극',
      '무료 연극',
    ].filter(Boolean),
    alternates: { canonical: `/programs/${id}` },
    openGraph: {
      type: 'article',
      title: `${program.title} | ${SITE_NAME}`,
      description,
      url: `/programs/${id}`,
      ...(program.posterUrl ? { images: [{ url: program.posterUrl }] } : {}),
    },
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
