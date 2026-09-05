import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '공지사항',
  description:
    '2026 가을연극축제의 공지사항입니다. 공연 일정 변경, 시민참여 모집, 예약 안내 등 축제 관련 소식을 가장 먼저 확인하세요.',
  keywords: ['가을연극축제 공지', '연극 축제 소식', '시민참여 모집 공고'],
  alternates: { canonical: '/notices' },
  openGraph: {
    title: '공지사항 | 2026 가을연극축제',
    description:
      '2026 가을연극축제의 공지사항입니다. 공연 일정 변경, 시민참여 모집, 예약 안내 등 축제 관련 소식을 가장 먼저 확인하세요.',
    url: '/notices',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
