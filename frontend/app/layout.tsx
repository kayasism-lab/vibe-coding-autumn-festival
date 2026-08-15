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
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
