import type { Metadata } from 'next'

// 이 폴더의 page.tsx는 'use client'라 metadata를 직접 쓸 수 없다.
// 서버 컴포넌트인 이 레이아웃이 검색엔진용 제목·설명만 얹어준다
export const metadata: Metadata = {
  title: '갤러리',
  description:
    '2026 가을연극축제와 역대 축제의 공연 사진, 연습 현장, 무대 뒤 이야기를 사진으로 만나보세요. 직장인 극단들의 생생한 순간을 담았습니다.',
  keywords: ['가을연극축제 사진', '연극 공연 사진', '직장인 극단 사진', '축제 갤러리'],
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: '갤러리 | 2026 가을연극축제',
    description:
      '2026 가을연극축제와 역대 축제의 공연 사진, 연습 현장, 무대 뒤 이야기를 사진으로 만나보세요. 직장인 극단들의 생생한 순간을 담았습니다.',
    url: '/gallery',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
