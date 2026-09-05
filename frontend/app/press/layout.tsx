import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '보도 · 미디어',
  description:
    '2026 가을연극축제 관련 언론 보도와 미디어 자료 모음. 직장인들의 이중생활, 전국직장인연극단체협의회 관련 기사와 영상을 확인하세요.',
  keywords: ['가을연극축제 기사', '직연협 보도', '전국직장인연극단체협의회 뉴스', '직장인 연극 기사'],
  alternates: { canonical: '/press' },
  openGraph: {
    title: '보도 · 미디어 | 2026 가을연극축제',
    description:
      '2026 가을연극축제 관련 언론 보도와 미디어 자료 모음. 직장인들의 이중생활, 전국직장인연극단체협의회 관련 기사와 영상을 확인하세요.',
    url: '/press',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
