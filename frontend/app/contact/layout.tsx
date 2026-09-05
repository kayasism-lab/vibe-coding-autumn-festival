import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '오시는 길 · 연락처',
  description:
    '전국직장인연극단체협의회(직연협) 사무국 연락처와 찾아오시는 길입니다. 2026 가을연극축제 관련 문의를 받습니다.',
  keywords: ['전국직장인연극단체협의회 연락처', '직연협 사무국', '가을연극축제 연락처', '오시는 길'],
  alternates: { canonical: '/contact' },
  openGraph: {
    title: '오시는 길 · 연락처 | 2026 가을연극축제',
    description:
      '전국직장인연극단체협의회(직연협) 사무국 연락처와 찾아오시는 길입니다. 2026 가을연극축제 관련 문의를 받습니다.',
    url: '/contact',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
