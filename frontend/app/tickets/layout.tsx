import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '예매안내',
  description:
    '2026 가을연극축제는 전 프로그램 무료입니다. 사전 예약 방법, 관람 시 유의사항, 좌석 안내 등 무료 관람에 필요한 모든 정보를 안내합니다.',
  keywords: ['가을연극축제 예매', '무료 연극 예매', '연극 무료 관람', '전석 무료 공연', '서울 무료 공연 예약'],
  alternates: { canonical: '/tickets' },
  openGraph: {
    title: '예매안내 | 2026 가을연극축제',
    description:
      '2026 가을연극축제는 전 프로그램 무료입니다. 사전 예약 방법, 관람 시 유의사항, 좌석 안내 등 무료 관람에 필요한 모든 정보를 안내합니다.',
    url: '/tickets',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
