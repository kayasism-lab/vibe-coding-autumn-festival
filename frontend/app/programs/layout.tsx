import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: {
    default: '공연 프로그램',
    // 하위 페이지(상세 등)에도 축제명이 붙도록 템플릿을 물려준다.
    // 문자열로만 두면 Next.js가 하위 세그먼트에 템플릿을 전달하지 않는다
    template: '%s | 2026 가을연극축제',
  },
  description:
    '직장인 극단의 연극 2편과 시민참여 열린 낭독극·단막극. 작품 소개와 출연 극단, 공연 회차를 확인하세요. 전석 무료.',
  keywords: ['가을연극축제 프로그램', '직장인연극', '무료 연극', '열린 낭독극', '열린 단막극', '서울 연극 공연'],
  alternates: { canonical: '/programs' },
  openGraph: {
    title: '공연 프로그램 | 2026 가을연극축제',
    description:
      '직장인 극단의 연극 2편과 시민참여 열린 낭독극·단막극. 작품 소개와 출연 극단, 공연 회차를 확인하세요. 전석 무료.',
    url: '/programs',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
