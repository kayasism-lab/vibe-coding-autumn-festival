/**
 * 검색엔진용 구조화 데이터(JSON-LD).
 *
 * 구글·네이버는 이 데이터를 읽고 "이건 단순한 웹페이지가 아니라
 * 특정 단체가 여는 축제 행사구나"를 이해한다. 그 결과 검색 결과에
 * 행사 기간·장소·가격이 함께 노출될 확률이 올라간다.
 *
 * 서버 컴포넌트라서 HTML에 그대로 박혀 나가고, 크롤러가 자바스크립트를
 * 실행하지 않아도 읽을 수 있다.
 */
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  ORGANIZER,
  ORGANIZER_SHORT,
  FESTIVAL_TITLE,
  FESTIVAL,
  OG_IMAGE,
} from '@/lib/seo'

// 주최 단체 (직연협) — 단체명으로 검색했을 때 이 사이트가 잡히게 하는 근거
const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: ORGANIZER,
  alternateName: [ORGANIZER_SHORT, '직장인연극단체협의회', '전국 직장인 연극단체 협의회'],
  url: SITE_URL,
  logo: `${SITE_URL}/logo/jikyeonhyeop.gif`,
  description:
    '전국직장인연극단체협의회(직연협)는 직장을 다니면서 연극을 하는 아마추어 극단들이 모인 단체로, 2001년부터 가을연극축제를 열고 있습니다.',
  sameAs: [FESTIVAL.organizerInstagram, FESTIVAL.organizerFacebook],
}

// 사이트 자체 — 검색 결과에 사이트명이 제대로 표기되도록 한다
const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: ['가을연극축제', '가을 연극 축제', '직장인들의 이중생활'],
  description: SITE_DESCRIPTION,
  inLanguage: 'ko-KR',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

// 축제 행사 자체 — 기간·장소·무료 여부를 검색엔진에 명시한다
const festivalEvent = {
  '@type': 'Festival',
  '@id': `${SITE_URL}/#event`,
  name: FESTIVAL_TITLE,
  alternateName: [
    '가을연극축제',
    '가을 연극 축제',
    '제24회 가을연극축제',
    '직장인들의 이중생활',
  ],
  description: SITE_DESCRIPTION,
  startDate: FESTIVAL.startDate,
  endDate: FESTIVAL.endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  url: SITE_URL,
  image: [OG_IMAGE.url],
  inLanguage: 'ko-KR',
  isAccessibleForFree: true,
  location: {
    '@type': 'Place',
    name: FESTIVAL.location,
    address: {
      '@type': 'PostalAddress',
      addressLocality: '서울',
      addressCountry: 'KR',
    },
  },
  organizer: { '@id': `${SITE_URL}/#organization` },
  performer: [
    { '@type': 'PerformingGroup', name: '극단 놀이터' },
    { '@type': 'PerformingGroup', name: '극단 아해' },
    { '@type': 'PerformingGroup', name: '극단 좋은사람들' },
    { '@type': 'PerformingGroup', name: '극단 연극패청년' },
    { '@type': 'PerformingGroup', name: '극단 함바꿈' },
  ],
  offers: {
    '@type': 'Offer',
    price: FESTIVAL.price,
    priceCurrency: 'KRW',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/tickets`,
    validFrom: FESTIVAL.startDate,
  },
}

const graph = {
  '@context': 'https://schema.org',
  '@graph': [organization, website, festivalEvent],
}

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // JSON-LD는 스크립트로 실행되지 않는 데이터 블록이라 이 방식이 표준이다
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
