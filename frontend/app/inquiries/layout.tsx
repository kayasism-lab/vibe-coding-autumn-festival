import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: {
    default: '문의하기',
    // 하위 페이지(상세 등)에도 축제명이 붙도록 템플릿을 물려준다.
    // 문자열로만 두면 Next.js가 하위 세그먼트에 템플릿을 전달하지 않는다
    template: '%s | 2026 가을연극축제',
  },
  description:
    '2026 가을연극축제 관람, 시민참여 신청, 극단 참가에 대해 궁금한 점을 문의하세요. 담당자가 확인 후 답변드립니다.',
  keywords: ['가을연극축제 문의', '연극 축제 문의', '시민참여 문의'],
  alternates: { canonical: '/inquiries' },
  openGraph: {
    title: '문의하기 | 2026 가을연극축제',
    description:
      '2026 가을연극축제 관람, 시민참여 신청, 극단 참가에 대해 궁금한 점을 문의하세요. 담당자가 확인 후 답변드립니다.',
    url: '/inquiries',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
