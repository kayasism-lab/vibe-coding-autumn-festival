import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '후원 · 협력',
  description:
    '2026 가을연극축제를 함께 만들어가는 후원·협력 기관을 소개합니다. 서울시 후원, 전국직장인연극단체협의회 주최·주관.',
  keywords: ['가을연극축제 후원', '서울시 후원 축제', '직연협 후원'],
  alternates: { canonical: '/sponsors' },
  openGraph: {
    title: '후원 · 협력 | 2026 가을연극축제',
    description:
      '2026 가을연극축제를 함께 만들어가는 후원·협력 기관을 소개합니다. 서울시 후원, 전국직장인연극단체협의회 주최·주관.',
    url: '/sponsors',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
