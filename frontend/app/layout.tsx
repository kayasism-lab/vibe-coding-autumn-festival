import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { StructuredData } from '@/components/seo/structured-data'
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  ORGANIZER,
  FESTIVAL_TITLE,
  OG_IMAGE,
} from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = {
  // 상대경로 이미지·canonical을 절대 URL로 바꿔주는 기준 주소.
  // 이게 없으면 OG 이미지가 깨져 카카오톡·페이스북 공유 썸네일이 안 뜬다
  metadataBase: new URL(SITE_URL),
  title: {
    default: '2026 가을연극축제: 직장인들의 이중생활 | 제24회, 전석 무료',
    template: '%s | 2026 가을연극축제',
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: ORGANIZER }],
  creator: ORGANIZER,
  publisher: ORGANIZER,
  applicationName: SITE_NAME,
  category: '공연·예술',
  // 대표 주소를 알려 중복 URL로 검색 순위가 갈리는 것을 막는다
  alternates: {
    canonical: '/',
  },
  // 모든 페이지를 색인해도 된다고 검색엔진에 명시한다
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: FESTIVAL_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: FESTIVAL_TITLE,
    description: '직장인 극단 연극과 시민참여 열린 낭독극·열린 단막극, 전석 무료',
    images: [OG_IMAGE.url],
  },
  // 구글·네이버 사이트 소유확인 코드. 각 서치콘솔에서 받은 값을 환경변수에
  // 넣으면 메타태그가 자동으로 붙는다 (값이 없으면 태그도 나가지 않는다)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { 'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION }
      : {},
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
        {/* 검색엔진이 "축제 행사 + 주최 단체"로 인식하도록 구조화 데이터를 HTML에 직접 심는다 */}
        <StructuredData />
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
