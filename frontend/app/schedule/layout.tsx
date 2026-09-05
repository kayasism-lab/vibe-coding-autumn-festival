import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '공연일정',
  description:
    '2026 가을연극축제 공연 일정표. 2026년 9월 19일부터 11월 29일까지 서울 공연장 4곳에서 열리는 총 10회 공연의 날짜·시간·장소를 확인하세요.',
  keywords: ['가을연극축제 일정', '가을 연극 축제 공연일정', '서울 연극 일정', '2026 연극 일정', '무료 공연 일정'],
  alternates: { canonical: '/schedule' },
  openGraph: {
    title: '공연일정 | 2026 가을연극축제',
    description:
      '2026 가을연극축제 공연 일정표. 2026년 9월 19일부터 11월 29일까지 서울 공연장 4곳에서 열리는 총 10회 공연의 날짜·시간·장소를 확인하세요.',
    url: '/schedule',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
