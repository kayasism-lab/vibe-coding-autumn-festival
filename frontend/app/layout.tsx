import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '2026 가을연극축제: 직장인들의 이중생활 | 제24회, 전석 무료',
    template: '%s | 2026 가을연극축제',
  },
  description:
    '전국직장인연극단체협의회 주최, 서울시 후원. 2026년 9월 19일부터 11월 29일까지, 직장인 극단 연극 2편과 시민 누구나 참여할 수 있는 열린 낭독극·열린 단막극을 무료로 만나보세요.',
  keywords: [
    '가을연극축제',
    '직장인들의 이중생활',
    '직장인연극',
    '전국직장인연극단체협의회',
    '시민참여',
    '열린낭독극',
    '열린단막극',
    '무료연극',
    '서울연극',
    '연극축제',
  ],
  authors: [{ name: '전국직장인연극단체협의회' }],
  creator: '전국직장인연극단체협의회',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://autumn-festival.vercel.app',
    siteName: '2026 가을연극축제',
    title: '2026 가을연극축제: 직장인들의 이중생활',
    description:
      '전국직장인연극단체협의회 주최, 서울시 후원. 직장인 극단 연극 2편과 시민참여 열린 낭독극·열린 단막극을 9월 19일부터 11월 29일까지 무료로 만나보세요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '2026 가을연극축제: 직장인들의 이중생활',
    description: '직장인 극단 연극과 시민참여 열린 낭독극·열린 단막극, 전석 무료',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7a2c2c' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  // 저시력 사용자를 배려해 두 손가락 확대/축소(핀치 줌)를 막지 않음
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 본문 서체: Pretendard Variable — dynamic subset이라 실제 쓰인 글자만 내려받는다 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 제목 강조 서체: 문화예술 지면 톤을 위한 명조 계열 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* no-page-custom-font 규칙은 Pages Router 기준 경고로, App Router의 루트 레이아웃에
            둔 폰트는 전 페이지에 적용되므로 해당하지 않는다 */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
