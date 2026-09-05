import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '시민참여 신청',
  description:
    '연극 경험이 없어도 괜찮습니다. 열린 낭독극·단막극에 시민 누구나 배우로 참여할 수 있습니다. 참가비 무료.',
  keywords: ['시민참여 연극', '열린 낭독극 신청', '열린 단막극 신청', '연극 배우 모집', '일반인 연극 참여', '무료 연극 워크숍'],
  alternates: { canonical: '/apply/citizen' },
  openGraph: {
    title: '시민참여 신청 | 2026 가을연극축제',
    description:
      '연극 경험이 없어도 괜찮습니다. 열린 낭독극·단막극에 시민 누구나 배우로 참여할 수 있습니다. 참가비 무료.',
    url: '/apply/citizen',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
