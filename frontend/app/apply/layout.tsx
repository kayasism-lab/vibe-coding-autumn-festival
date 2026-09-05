import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: {
    default: '극단 참가 신청',
    // 하위 페이지(상세 등)에도 축제명이 붙도록 템플릿을 물려준다.
    // 문자열로만 두면 Next.js가 하위 세그먼트에 템플릿을 전달하지 않는다
    template: '%s | 2026 가을연극축제',
  },
  description:
    '2026 가을연극축제에 참가할 직장인 극단을 모집합니다. 참가 자격, 신청 절차, 제출 서류를 확인하고 온라인으로 신청하세요.',
  keywords: ['직장인 극단 모집', '연극축제 참가 신청', '극단 참가', '아마추어 극단 모집'],
  alternates: { canonical: '/apply' },
  openGraph: {
    title: '극단 참가 신청 | 2026 가을연극축제',
    description:
      '2026 가을연극축제에 참가할 직장인 극단을 모집합니다. 참가 자격, 신청 절차, 제출 서류를 확인하고 온라인으로 신청하세요.',
    url: '/apply',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
