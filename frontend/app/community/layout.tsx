import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: {
    default: '자유게시판',
    // 하위 페이지(상세 등)에도 축제명이 붙도록 템플릿을 물려준다.
    // 문자열로만 두면 Next.js가 하위 세그먼트에 템플릿을 전달하지 않는다
    template: '%s | 2026 가을연극축제',
  },
  description:
    '2026 가을연극축제 관람객과 참여자들이 자유롭게 이야기를 나누는 공간입니다. 관람 후기와 참여 소감을 남겨보세요.',
  keywords: ['가을연극축제 후기', '연극 관람 후기', '축제 게시판'],
  alternates: { canonical: '/community' },
  openGraph: {
    title: '자유게시판 | 2026 가을연극축제',
    description:
      '2026 가을연극축제 관람객과 참여자들이 자유롭게 이야기를 나누는 공간입니다. 관람 후기와 참여 소감을 남겨보세요.',
    url: '/community',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
