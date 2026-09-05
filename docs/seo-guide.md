# 검색 노출(SEO) 가이드

> 2026-09-05 작업. "가을연극축제 / 가을 연극 축제 / 직장인들의 이중생활 / 직연협 /
> 전국직장인연극단체협의회" 등으로 검색했을 때 홈페이지가 나오게 하는 작업 기록과, **사람이 직접 해야 하는 후속 절차**입니다.

---

## 1. 가장 중요한 것 — 코드만으로는 끝나지 않는다

검색은 두 가지가 모두 있어야 됩니다.

| 구분 | 내용 | 상태 |
|---|---|---|
| **① 사이트 쪽 준비** | 검색엔진이 읽을 제목·설명·키워드·사이트맵을 갖추는 일 | **코드로 완료** ✅ |
| **② 검색엔진에 신고** | 구글·네이버에 "우리 사이트 여기 있어요"라고 등록하는 일 | **직접 해야 함** ⬅ 아래 3번 |

②를 안 하면 아무리 코드를 잘 짜도 **네이버에서는 거의 검색되지 않습니다.**
네이버는 등록하지 않은 사이트를 잘 수집하지 않기 때문입니다.

---

## 2. 코드로 끝낸 작업

| 파일 | 하는 일 |
|---|---|
| `frontend/lib/seo.ts` | 사이트 주소·축제 정보·검색 키워드 모음 (여기만 고치면 전체 반영) |
| `frontend/app/layout.tsx` | 전체 페이지 공통 제목·설명·키워드, 공유 썸네일, 소유확인 코드 |
| `frontend/components/seo/structured-data.tsx` | 구글이 "축제 행사 + 주최 단체"로 인식하게 하는 JSON-LD |
| `frontend/app/robots.ts` | `/robots.txt` 자동 생성 (관리자 페이지는 검색 제외) |
| `frontend/app/sitemap.ts` | `/sitemap.xml` 자동 생성 (전체 페이지 + 작품·공지 상세) |
| `frontend/app/*/layout.tsx` | 페이지마다 다른 제목·설명 (전부 같은 제목이던 문제 해결) |
| `frontend/app/programs/[id]/layout.tsx` | 작품 상세에 실제 작품명이 검색 제목으로 뜨게 |
| `frontend/app/notices/[id]/layout.tsx` | 공지 상세에 실제 공지 제목이 뜨게 |
| `frontend/public/images/og-image.jpg` | 카카오톡·페이스북 공유 시 뜨는 1200×630 썸네일 |

**등록한 검색 키워드** (`lib/seo.ts`의 `SITE_KEYWORDS`) — 띄어쓰기 변형까지 모두 포함:
`가을연극축제`, `가을 연극 축제`, `가을 연극축제`, `가을연극 축제`, `가을연극`, `가을 연극`,
`2026 가을연극축제`, `제24회 가을연극축제`, `가을연극제`, `축제`, `연극축제`,
`직장인들의 이중생활`, `이중생활`, `전국직장인연극단체협의회`, `직연협`,
`직장인연극`, `아마추어 연극`, `시민참여`, `열린낭독극`, `열린단막극`, `무료연극`,
`서울 연극`, `서울 무료 공연`, 참여 극단 5곳 이름 등 (총 50여 개)

---

## 3. 지금 직접 해야 하는 일 (순서대로)

### 3-1. 네이버 서치어드바이저 등록 — **가장 효과 큼**

1. https://searchadvisor.naver.com 접속 → 네이버 계정 로그인
2. **웹마스터 도구** → 사이트 등록에 `https://jik-autumn-festival.vercel.app` 입력
3. **사이트 소유확인** 화면에서 `HTML 태그` 방식을 선택
   → `<meta name="naver-site-verification" content="여기가긴문자열" />` 이 나옵니다
4. 그 **`content` 안의 문자열만** 복사
5. Vercel → 프로젝트 → Settings → Environment Variables 에 추가
   - Name: `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`
   - Value: 4번에서 복사한 문자열
6. Vercel에서 **Redeploy**(재배포). 배포가 끝나야 태그가 붙습니다
7. 다시 서치어드바이저로 돌아가 **소유확인** 버튼 클릭
8. 확인되면 **요청 → 사이트맵 제출**에 `sitemap.xml` 입력
9. **요청 → 웹페이지 수집**에 홈 주소를 넣어 수동으로 수집 요청

### 3-2. 구글 서치 콘솔 등록

1. https://search.google.com/search-console 접속 → 구글 계정 로그인
2. 속성 추가 → **URL 접두어**에 `https://jik-autumn-festival.vercel.app` 입력
3. 소유권 확인에서 **HTML 태그** 선택 → `content` 값만 복사
4. Vercel 환경변수에 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 으로 추가 → Redeploy
5. 확인 후 **Sitemaps** 메뉴에서 `sitemap.xml` 제출
6. **URL 검사**에 홈 주소를 넣고 "색인 생성 요청"

### 3-3. 다음(카카오) 검색 등록

1. https://register.search.daum.net/index.daum 접속
2. 사이트 주소 입력 후 신청 (별도 소유확인 없이 신청서 방식)

### 3-4. 배포 주소 환경변수 (권장)

Vercel 환경변수에 아래를 추가해두면 도메인이 바뀌어도 코드 수정 없이 따라갑니다.

- Name: `NEXT_PUBLIC_SITE_URL`
- Value: `https://jik-autumn-festival.vercel.app`

> 값을 안 넣어도 `lib/seo.ts`의 기본값으로 동작합니다.

---

## 4. 검색이 잘 되게 하는 추가 활동 (코드 밖의 일)

검색 순위는 **"다른 곳에서 우리 사이트를 얼마나 링크하는가"**가 크게 좌우합니다.
특히 네이버는 블로그·카페·뉴스에 강하게 반응합니다.

- 직연협 및 참여 극단 5곳의 **인스타그램·다음카페 프로필에 홈페이지 주소 넣기** (가장 쉽고 효과 큼)
- **네이버 블로그**에 축제 소개글을 올리고 본문에 홈페이지 링크 걸기
- **보도자료 배포** 시 기사에 홈페이지 주소가 들어가게 요청
- 서울시·문화재단 등 **후원기관 행사 소개 페이지에 링크 요청**
- 공연 포스터·리플렛·현수막에 **QR코드**로 홈페이지 주소 넣기

---

## 5. 확인 방법

배포 후 아래 주소가 정상적으로 열리면 준비가 끝난 것입니다.

- https://jik-autumn-festival.vercel.app/robots.txt
- https://jik-autumn-festival.vercel.app/sitemap.xml

공유 썸네일 확인:
- 카카오톡: 나에게 보내기로 링크를 보내 썸네일 확인
  (예전에 공유한 적 있으면 https://developers.kakao.com/tool/debugger/sharing 에서 캐시 초기화)
- 페이스북: https://developers.facebook.com/tools/debug/

구조화 데이터 확인:
- https://search.google.com/test/rich-results 에 홈 주소 입력

---

## 6. 얼마나 걸리나

| 검색엔진 | 첫 노출까지 |
|---|---|
| 구글 | 보통 3일 ~ 2주 |
| 네이버 | 보통 1주 ~ 4주 (등록 안 하면 사실상 안 나옴) |
| 다음 | 보통 2주 ~ 1개월 |

**등록 직후에 검색해서 안 나온다고 잘못된 게 아닙니다.** 색인에 시간이 걸립니다.
`site:jik-autumn-festival.vercel.app` 로 검색하면 현재 색인된 페이지 수를 볼 수 있습니다.

---

## 7. 주의사항

- **공지·작품 상세 페이지의 검색 제목은 백엔드(Cloudtype)가 응답해야 채워집니다.**
  백엔드가 꺼져 있으면 "공연 상세" 같은 일반 제목으로 나갑니다.
- 사이트맵은 **1시간마다** 다시 만들어집니다. 새 공지를 올리고 바로 반영되지 않아도 정상입니다.
- `/admin`, `/login`, `/signup`, `/apply/status`, 문의 상세는 **의도적으로 검색에서 제외**했습니다.
