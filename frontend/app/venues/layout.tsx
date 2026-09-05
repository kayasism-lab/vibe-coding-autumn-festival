import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '공연장 안내',
  description:
    '2026 가을연극축제가 열리는 서울시 소재 공연장 4곳의 위치, 오시는 길, 주차 정보와 시설 안내를 확인하세요.',
  keywords: ['가을연극축제 공연장', '서울 소극장', '연극 공연장 위치', '오시는 길'],
  alternates: { canonical: '/venues' },
  openGraph: {
    title: '공연장 안내 | 2026 가을연극축제',
    description:
      '2026 가을연극축제가 열리는 서울시 소재 공연장 4곳의 위치, 오시는 길, 주차 정보와 시설 안내를 확인하세요.',
    url: '/venues',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
