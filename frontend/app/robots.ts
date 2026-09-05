import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * /robots.txt 를 자동 생성한다.
 * 크롤러가 사이트에 처음 들어와서 제일 먼저 읽는 파일이며,
 * 여기 적힌 sitemap 주소를 따라가 전체 페이지 목록을 파악한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 관리자·로그인·개인 신청조회는 검색에 노출될 이유가 없다
        disallow: ['/admin', '/admin/', '/login', '/signup', '/apply/status', '/api/'],
      },
      // 네이버(Yeti)·다음(Daum) 크롤러도 같은 규칙을 명시적으로 적용한다
      { userAgent: 'Yeti', allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
      { userAgent: 'Daumoa', allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
