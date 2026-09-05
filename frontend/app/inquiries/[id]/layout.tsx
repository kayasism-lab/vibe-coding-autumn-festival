import type { Metadata } from 'next'

// 개인 정보가 오가거나 검색으로 유입될 이유가 없는 화면이라
// 검색 결과에서 제외한다(noindex). 링크 추적은 허용해 사이트 구조는 전달한다
export const metadata: Metadata = {
  title: '문의 상세',
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
