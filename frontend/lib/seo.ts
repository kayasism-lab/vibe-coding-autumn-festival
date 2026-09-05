/**
 * SEO 공용 상수.
 * 사이트 주소, 축제 기본 정보, 검색 키워드를 한곳에 모아두고
 * layout / sitemap / robots / 구조화 데이터가 모두 이 값을 가져다 쓴다.
 * (주소나 축제 정보가 바뀌면 이 파일만 고치면 된다)
 */

// 실제 배포 주소. Vercel 도메인이 바뀌면 환경변수 NEXT_PUBLIC_SITE_URL로 덮어쓸 수 있다
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://jik-autumn-festival.vercel.app'

export const SITE_NAME = '2026 가을연극축제'
export const ORGANIZER = '전국직장인연극단체협의회'
export const ORGANIZER_SHORT = '직연협'
export const FESTIVAL_TITLE = '2026 가을연극축제: 직장인들의 이중생활'

// 축제 기본 정보 (구조화 데이터 Event에 그대로 들어간다)
export const FESTIVAL = {
  edition: 24,
  startDate: '2026-09-19',
  endDate: '2026-11-29',
  location: '서울시 소재 공연장 4곳',
  price: '0',
  organizerInstagram: 'https://www.instagram.com/jikplay1997',
  organizerFacebook: 'https://www.facebook.com/jikplay/?locale=ko_KR',
} as const

// 대표 공유 이미지 (카카오톡·페이스북·트위터 썸네일)
export const OG_IMAGE = {
  url: `${SITE_URL}/images/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: '2026 가을연극축제 직장인들의 이중생활 - 전국직장인연극단체협의회 주최',
}

/**
 * 검색 키워드.
 * 한국어 검색은 띄어쓰기를 다르게 넣는 경우가 많아서
 * "가을연극축제 / 가을 연극 축제 / 가을 연극축제"처럼 변형을 모두 넣어둔다.
 */
export const SITE_KEYWORDS = [
  // 축제명 + 띄어쓰기 변형
  '가을연극축제',
  '가을 연극 축제',
  '가을 연극축제',
  '가을연극 축제',
  '가을연극',
  '가을 연극',
  '2026 가을연극축제',
  '2026 가을 연극 축제',
  '제24회 가을연극축제',
  '가을연극제',
  '가을 연극제',
  '축제',
  '연극축제',
  '연극 축제',
  // 부제
  '직장인들의 이중생활',
  '직장인의 이중생활',
  '이중생활',
  '직장인 이중생활',
  // 주최 단체
  '전국직장인연극단체협의회',
  '직장인연극단체협의회',
  '직연협',
  '직장인 연극 단체',
  // 성격·프로그램
  '직장인연극',
  '직장인 연극',
  '아마추어 연극',
  '생활문화예술',
  '시민참여 연극',
  '시민참여',
  '열린낭독극',
  '열린 낭독극',
  '낭독극',
  '열린단막극',
  '열린 단막극',
  '단막극',
  '무료연극',
  '무료 연극',
  '전석 무료 공연',
  // 지역·시기
  '서울 연극',
  '서울 연극축제',
  '서울 무료 공연',
  '가을 공연',
  '가을 문화행사',
  '2026 연극',
  // 참여 극단
  '극단 놀이터',
  '극단 아해',
  '극단 좋은사람들',
  '극단 연극패청년',
  '극단 함바꿈',
]

// 검색 결과 스니펫에 쓰일 대표 소개 문구 (한 문장 요약)
export const SITE_DESCRIPTION =
  '2026 가을연극축제 「직장인들의 이중생활」 — 전국직장인연극단체협의회(직연협) 주최·주관, 서울시 후원. ' +
  '2026년 9월 19일부터 11월 29일까지 서울 공연장 4곳에서 낮에는 직장인, 밤에는 배우인 사람들의 연극 2편과 ' +
  '시민 누구나 참여하는 열린 낭독극·열린 단막극을 전석 무료로 선보입니다.'

/**
 * 검색엔진 사이트 소유확인 코드.
 *
 * 네이버 서치어드바이저·구글 서치 콘솔이 "이 사이트가 정말 당신 것인가"를
 * 확인하려고 요구하는 값이다. 페이지 소스에 그대로 노출되는 공개 값이라
 * 비밀이 아니며, 코드에 둬도 안전하다.
 *
 * 환경변수가 있으면 그 값을 우선 쓰고, 없으면 아래 기본값을 쓴다
 * (Vercel 대시보드를 건드리지 않아도 배포만 하면 동작하도록)
 */
export const NAVER_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ||
  '73c924d450480b24f45ae7d2fc7890b7df9f7c56'

// 구글 서치 콘솔은 아직 발급 전이라 비워 둔다. 값이 없으면 태그도 나가지 않는다
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''
