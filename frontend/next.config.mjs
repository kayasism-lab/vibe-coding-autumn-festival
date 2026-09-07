/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000'

/**
 * 옛 Vercel 주소 → 새 대표 도메인(or.kr) 자동 이동 설정.
 *
 * 2026-09-07에 대표 주소를 jik-autumn-festival.or.kr 로 옮겼다.
 * 그 전에 SNS·보도자료에 뿌려둔 vercel.app 주소가 죽으면 안 되므로,
 * 옛 주소로 들어온 방문자를 새 주소의 "같은 경로"로 301(영구 이동)시킨다.
 * 301이라 구글도 색인을 새 도메인으로 옮겨준다.
 *
 * 기본값은 lib/seo.ts 의 SITE_URL 과 반드시 같은 값을 유지할 것.
 * (한쪽만 바꾸면 메타태그 주소와 이동 목적지가 어긋난다)
 */
const SITE_URL_FALLBACK = 'https://jik-autumn-festival.or.kr'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || SITE_URL_FALLBACK

/**
 * 아래 두 조건을 모두 만족할 때만 규칙을 만든다 (안전장치).
 * 1. Vercel 프로덕션 배포일 것
 *    → 미리보기(Preview) 배포도 *.vercel.app 을 쓰는데, 여기까지 이동시키면
 *      배포 전 확인이 불가능해진다
 * 2. 목적지가 vercel.app 이 아닐 것
 *    → 환경변수에 실수로 옛 주소를 넣으면 자기 자신으로 무한 이동하게 된다
 */
const shouldRedirectLegacyHost =
  process.env.VERCEL_ENV === 'production' && !siteUrl.includes('vercel.app')

const LEGACY_VERCEL_HOST = 'jik-autumn-festival.vercel.app'

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    if (!shouldRedirectLegacyHost) return []

    return [
      {
        // :path* 는 루트(/)를 포함한 모든 경로를 받는다. 쿼리스트링은 Next가 알아서 넘겨준다.
        source: '/:path*',
        has: [{ type: 'host', value: LEGACY_VERCEL_HOST }],
        destination: `${siteUrl}/:path*`,
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
