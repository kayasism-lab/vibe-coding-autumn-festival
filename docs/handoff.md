# 핸드오프 문서 (2026-08-15 최종 갱신)

다음 세션에서 이어서 작업할 때 먼저 읽을 문서. 상세 콘텐츠/기능 기획은
`docs/festival-site-improvement-plan.md` (v2) 참고, 이 문서는 **배포 상태 +
이번 세션 작업 이력 + 다음 할 일**만 다룸.

## 1. 배포 상태 (완료)

| 구성 요소 | 플랫폼 | 주소 | 상태 |
|---|---|---|---|
| 프론트엔드 | Vercel | https://jik-autumn-festival.vercel.app | Ready, GitHub main 브랜치 push 시 자동 재배포 |
| 백엔드 | Cloudtype | https://port-0-vibe-coding-autumn-festival-mstu4cssd1ffbfff.sel3.cloudtype.app | 실행 중, GitHub main 브랜치 push 시 자동 재배포 |
| DB | MongoDB Atlas | 클러스터를 shopping-mall-demo와 **공유**, DB 이름만 `autumn_festival`로 분리 | 정상 |
| GitHub | kayasism-lab/vibe-coding-autumn-festival | 비공개 저장소, `main` 브랜치가 곧 배포 브랜치 | - |
| Cloudinary | shopping-mall-demo 계정 재사용 | cloud name `dcyrw85bi`, upload preset `moonlight` | 정상 |

**환경변수 실제 값**은 이 저장소에 커밋하지 않았음(보안). 아래 위치에서 확인:
- 로컬 파일 `백엔드환경값.txt` (저장소 루트, `.gitignore` 처리되어 있어 git엔 없음 — 파일 자체는 로컬에 남아있음)
- 또는 Cloudtype/Vercel 각 대시보드의 Environment Variables 화면

Cloudtype 배포 시 알게 된 주의사항 (다음에 백엔드 설정 다시 건드릴 때 참고):
- Install command는 반드시 `npm install --include=dev`로 설정해야 함. `NODE_ENV=production`이 설정되어 있으면 npm이 devDependencies(typescript 등)를 자동으로 빼버려서 `tsc: not found`로 빌드 실패함.
- "서브 디렉토리"(Root Directory에 해당)를 `backend`로 반드시 지정해야 함. 모노레포라 루트 기준으로 빌드하면 루트 package.json의 `build` 스크립트(`--workspace backend && --workspace frontend`)가 실행되어 엉뚱하게 실패함.
- Vercel도 마찬가지로 Root Directory를 `frontend`로 지정.
- Vercel의 `API_BASE_URL`과 Cloudtype의 `FRONTEND_ORIGIN`은 서로의 실제 배포 주소를 정확히 알아야 CORS/프록시가 정상 동작함. 한쪽 도메인을 바꾸면 반드시 반대쪽 환경변수도 같이 갱신 필요.

## 2. 이번 세션(2026-08-15) 작업 이력

하루 종일 이어진 세션이라 커밋이 많음. 주제별로 묶어서 정리(시간순은 `git log`로 확인 가능):

**초기 작업** (오전~오후, 이전 핸드오프 문서에 이미 기록됨):
- 공연 일정 회차 통합, 모바일 후원 로고 노출, 관리자 로그인 개편(아이디/비밀번호 계정 체계, 슈퍼관리자/관리자/극단담당자/일반회원 권한)
- 관람안내 유의사항·장소 지도연결(네이버 지도), 모바일 메뉴 닫기버튼, 헤더 로고를 직연협 아이콘으로 교체
- 사이트 전체 공연장 위치 아이콘을 주소 연동 지도 버튼(`VenueMapButton`)으로 통일
- 오시는길/후원사/갤러리 페이지가 고정 헤더에 가려지는 문제 수정, 상단 바 "오시는 길" 링크 제거
- 공연 유형 "뮤지컬" 삭제 → "낭독극" 신설, 열린 낭독극과 연결
- 공연장 안내 "3곳" → "4곳" 수정, 히어로 "전석 무료" 태그·"무료 관람 안내" 버튼 디자인 통일
- 히어로 통계 카드(연극/낭독극/단막극)를 `/programs?type=` 필터 페이지로 연결
- 히어로 부제 아이콘(직장인/배우 이미지, 배경 제거) 추가 및 크기 조정, "이중생활" 강조
- 파비콘을 Next.js 기본 아이콘에서 배우/스포트라이트 아이콘으로 교체

**이후 작업** (저녁, 이번 핸드오프 갱신 직전까지):
1. `617928a` 관리자 페이지 7곳(대시보드/갤러리/문의/공지/프로그램/후원사/사용자)이 `lg:ml-64` 마진 방식과 `AdminSidebar`의 `lg:static`이 충돌해 데스크톱에서 스크롤을 내려야 콘텐츠가 보이던 버그 수정 → `flex` 래퍼 패턴으로 통일
2. `7d11f89` 관리자 로그인에 "로그인 정보 저장" 체크박스 추가(아이디만 localStorage 저장) + `autoComplete` 속성으로 브라우저 자체 비밀번호 관리자 연동
3. `3960951` 사이트 설정(`/admin/settings`) 페이지 진입 시 발생하던 크래시 수정 — 서버에 저장된 히어로 설정 값에 `stats` 필드가 없어 `undefined.programs` 참조로 페이지 전체가 깨졌던 문제. 서버 응답을 기본값과 병합하도록 수정
4. `b8eb742`~`eedee52` 인스타그램(`jikplay1997`) 연동: 사이트 설정 DB에 실제 인스타 주소 반영(로컬+Atlas), 히어로 배지("전국직장인연극단체협의회(직연협) 주최")에 인스타 아이콘 추가(처음엔 상단 바에 넣었다가 히어로 배지로 위치 수정), "직연협" 약칭 추가 및 황금색 강조, 인스타 아이콘도 황금색으로
5. `76503dd` 메인페이지의 "주최" 문구 3곳(히어로 배지/상단 바/푸터)을 "주최·주관"으로 변경
6. `221a665` 푸터 SNS 아이콘 버그 수정 — 페이스북 아이콘이 실제로는 다음카페 주소로 연결되어 있었음. 페이스북 아이콘은 실제 페이스북(`facebook.com/jikplay`)으로, 다음카페는 별도 웹(지구본) 아이콘으로 분리
7. `cd95f7a` `/about` 페이지 축제소개 설명 문구에 수동 줄바꿈 적용 (공용 컴포넌트 `PageHeader`에 `whitespace-pre-line` 추가)

**DB 직접 반영 작업** (코드 커밋과 별개, 로컬 DB + Atlas 운영 DB 양쪽에 임시 스크립트로 직접 실행 후 스크립트는 삭제):
- 이전 세션분: 극단 더폼 삭제, 연극패청년 단체사진 Cloudinary 업로드 반영, 극단 5곳 SNS 링크 채움, v0 스캐폴딩 잔재(중복 극단/가짜 공연장) 정리
- 이번 갱신분: `SiteConfig` 컬렉션의 `siteInfo.snsLinks.instagram` 값을 `https://www.instagram.com/jikplay1997`로 설정

## 2-1. 추가 세션(같은 날, 저장소 재접속 후) 작업 이력

1. **운영(Atlas) DB → 로컬 DB 동기화 완료**: 다른 사람에게 로컬 테스트를 맡길 예정인데 테스트 중 운영 DB 값이 바뀔 수 있어서, 우선 운영 DB의 현재 상태를 로컬에 그대로 복사해 미러링함(반대 방향 아님 — 로컬이 운영을 따라감).
   - 사전에 운영 `siteconfigs`의 미사용 잔재 key(`hero`, `festival`, 초기 시딩 흔적) 2건 삭제 완료.
   - 정리 후 운영/로컬 양쪽을 JSON으로 백업: `db-backups/2026-08-15T14-25-03-861Z/{atlas,local}/*.json` (저장소 루트, `.gitignore`에 `db-backups/` 추가해 git 추적 제외 — 개인정보·비밀번호 해시 포함).
   - 이후 로컬 DB 전체 컬렉션을 운영 데이터로 덮어씀. 동기화 후 양쪽 컬렉션 건수 전부 일치 확인(`admins` 1건 포함 — 로컬에서도 운영과 동일한 관리자 계정/비밀번호로 로그인 가능해짐).
   - 사용한 임시 스크립트(`backend/src/scripts/_compare-db.ts`, `_inspect-diff.ts`, `_sync-atlas-to-local.ts`)는 작업 후 전부 삭제함(관행대로).
2. **미완료**: "다른 사람에게 git 주소를 주고 로컬 테스트시키려면 뭘 줘야 하나" 질문에 답하다가 세션 종료. 아래 "다음 할 일" 1번 참고.
3. **미커밋 변경사항**: `.gitignore`에 `db-backups/` 추가한 것만 워킹트리에 남아있음(커밋 여부 미확인, 다음 세션 시작 시 확인 필요). 저장소 루트의 `각 극단 홈페이지_인스타.txt`는 여전히 미추적 상태로 남아있음(이미 seed 스크립트에 반영된 참고용 파일, git엔 없음).

## 3. 알려진 이슈 / 기술 부채

- `backend/src/scripts/seed-admin.ts`가 계정 생성 성공 후 `process.exit(0)`을 호출하지 않아 스크립트가 안 끝나고 멈춤(성공 로그는 찍힘). 아직 코드 수정 안 함, 실행할 때는 성공 메시지만 확인하고 별도 명령으로 넘어가면 됨.
- 헤더 상단 바 크기 관련 값들(`h-11`, 로고 `h-8`/`h-7` 등, 그리고 18개 하위 페이지의 `pt-[8.25rem]`)은 서로 맞물려 있음 — 상단 바 높이를 또 바꾸면 그 18개 파일의 `pt-[...]` 값도 같이 조정해야 레이아웃이 깨지지 않음. 대상 파일 목록은 `grep -rl "pt-\[8.25rem\]" frontend/app`로 확인 가능.
- **`/admin/settings`(사이트 설정) 페이지가 사실상 홈페이지에 반영되지 않음.** 히어로 섹션(`hero-section.tsx`)·헤더(`header.tsx`)·푸터(`footer.tsx`)의 텍스트·SNS 링크·통계 수치가 전부 컴포넌트에 하드코딩되어 있고, `SiteConfig`(hero/siteInfo) 컬렉션은 관리자 페이지에서만 읽고 쓸 뿐 실제 화면 렌더링에는 전혀 쓰이지 않음. 즉 지금은 관리자가 사이트 설정을 바꿔도 홈페이지엔 반영 안 됨 — "설정"이라는 이름값을 못 하는 상태. 다음에 손볼 때는 (a) 이 컴포넌트들을 실제로 DB 값을 읽어오도록 리팩터링하거나, (b) 사이트 설정 페이지 자체를 축소/제거하고 코드로만 관리하는 것으로 방향을 정해야 함(사용자 확인 필요).
- 브라우저 자동화(Claude in Chrome 확장)가 이번 세션 내내 연결되지 않음(`tabs_context_mcp` 호출 시 "Browser extension is not connected" 반복). 매번 스크린샷을 사용자가 캡쳐해서 전달하는 방식으로 확인 진행 중. 다음 세션에서도 재확인 필요.

## 4. 다음 할 일 (우선순위 순)

0. **[신규 최우선] 로컬 테스트 환경 배포 준비 — 다음 세션 시작 시 이어서 결정**
   - 사용자가 지인/동료에게 git 저장소 주소를 주고 로컬에서 테스트를 맡기고 싶어함. 논의 중 세션 종료.
   - 확정된 것: 저장소는 비공개라 GitHub Collaborator 초대 필요(아직 미실행). `.env` 값 중 `MONGODB_URI`는 절대 운영 Atlas 주소를 주면 안 되고 테스터의 로컬 몽고를 가리켜야 함(안 그러면 테스터의 로컬 작업이 실제 운영 DB에 반영됨). `JWT_SECRET`류는 로컬끼리만 쓰는 값이라 아무 값이나 무방. Cloudinary는 `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dcyrw85bi`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=moonlight` (unsigned preset이라 노출돼도 무방, API secret 불필요).
   - **미결정**: 테스터에게 어떤 DB 데이터를 줄지. 세 가지 안을 제시했으나 사용자 답변 전에 세션 종료:
     - (A, 권장) `npm run seed:festival` + `npm run seed:admin`으로 테스터가 로컬에서 직접 더미 데이터/테스트 관리자 계정(`admin@festival.com`/`admin1234`) 생성 — 실제 개인정보 노출 없음
     - (B) `admins`/`users` 제외하고 콘텐츠성 컬렉션(programs/schedules/theatergroups/venues 등)만 추린 데이터를 전달 + 테스터는 `seed:admin`으로 관리자 계정만 별도 생성
     - (C, 비권장) 방금 만든 백업(`db-backups/.../local/`)을 그대로 전달 — 실제 관리자 비밀번호 해시·사용자 이메일 포함이라 보안상 권장 안 함
   - 다음 세션 시작 시 이 방향(A/B/C)부터 확인 후, 필요하면 `.env` 파일 작성 및 (원하면) GitHub Collaborator 초대까지 진행.

1. **[최우선] 인스타그램(`@jikplay1997`) 게시물 대표 이미지를 메인화면 "직연협 발자취" 갤러리로 연동하는 방안 검토**
   - 사용자 요청: 인스타 계정에 그동안 올라온 게시물 대표 이미지(스크린샷 기준 최근 게시물들, 최대 100장 언급)를 가져와서 메인화면에 "직연협 발자취"라는 이름의 갤러리 섹션으로 보여주고 싶어함.
   - 이번 세션에 검토한 제약: 브라우저 자동화 미연결이라 직접 스크래핑 불가. 인스타그램은 무료 공개 API로 특정 계정 게시물을 대량 조회하는 기능을 제공하지 않고, 비공식 스크래핑은 ToS 위반 소지 + 로그인 세션 필요로 자동화 불안정.
   - 검토했던 선택지 두 가지:
     - **(A) 정식 연동(자동 동기화)**: 인스타그램 계정을 비즈니스/크리에이터 계정으로 전환 → Meta 개발자 앱 생성 → Facebook 페이지 연결 → 액세스 토큰 발급(계정 소유자, 즉 사용자가 직접 해야 하는 단계 포함) → 이후 백엔드에서 Instagram Graph API로 최신 게시물을 주기적으로 가져와 자동 반영. 한 번 설정하면 이후 새 게시물이 자동으로 올라옴. 다음 세션에서 설정 단계를 안내하며 진행 가능.
     - **(B) 수동 등록(바로 가능)**: 원하는 사진들을 사용자가 직접 저장해서 전달하거나 기존 `/admin/gallery` 업로드 화면(이미 다중 업로드 지원)에 직접 올리면, 메인화면에 "직연협 발자취" 그리드 갤러리 섹션(신규 컴포넌트)만 만들어서 바로 노출 가능. 다만 100장을 낱개로 준비하는 수작업이 필요.
   - 사용자가 "나중에 다시 하자"며 보류했던 건 - **다음 세션 시작 시 이 주제부터 이어서 방향(A/B) 확인 후 진행**.
2. **Phase 3-1**: 극단 공개 페이지(`/theater-groups` 목록 + 상세) — 현재 홈 히어로 모달이 유일한 노출 경로
3. **Phase 3-2**: 극단이 공연 준비 영상(유튜브 링크+미리보기)/사진을 직접 업로드하는 기능 — Cloudinary 계정은 이미 연동 준비됨
4. **Phase 4**: 히어로 배경 사진 crossfade 효과
5. 미해결 확인사항(사용자 답변 필요): 낭독극 정확한 장소, "제24회" 표기 여부 — `layout.tsx` 메타데이터에 이미 "제24회"로 박혀있어서 답변에 따라 수정 필요할 수 있음
6. Phase 6/7 나머지: 모바일 하단 CTA, SEO(sitemap/robots/JSON-LD), `/privacy` `/terms` 실제 페이지
7. (참고용, 급하지 않음) 위 "3번 알려진 이슈"의 사이트 설정↔실제 화면 미연동 문제 — 사용자가 원할 때 방향을 정해서 정리

## 5. 자주 쓰는 명령 (참고용)

```powershell
# 로컬 개발 서버
npm run dev:backend --workspace backend
npm run dev:frontend --workspace frontend

# DB 재시딩 (로컬)
npm run seed:festival --workspace backend

# Atlas(운영) DB에 스크립트 실행할 때 패턴
# backend/src/scripts/_임시스크립트.ts 작성 후:
MONGODB_URI="<Atlas 연결 문자열>" npx tsx src/scripts/_임시스크립트.ts
# 실행 후 임시 스크립트 파일은 삭제

# 배포 전 프론트엔드 검증 순서 (매 변경마다 이 순서로 확인)
cd frontend
npx tsc --noEmit -p .
npm run lint
npm run build
```
