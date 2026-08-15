# 핸드오프 문서 (2026-08-15 기준)

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

커밋 순서대로:

1. `543e861` 2026 가을연극축제 사이트 초기 커밋
2. `6f6072c` tsbuildinfo 빌드 캐시 git 추적 제외
3. `d20e6f1` Vercel/Cloudtype 배포 가이드 문서 추가 (`docs/deployment-guide.md`)
4. `1e19c49` 극단 더폼 제거(히어로/푸터/소개페이지/시딩 스크립트), 히어로 타이틀에 부제 "(직장인들의 이중생활)" 추가, 관람안내 버튼 흰 배경 버그 수정
5. `f6572f8` 상단 바에 주최(직연협 로고)/후원(서울시 로고) 표시 추가
6. `49e6434` 상단 바 높이 2배 확대 (요청 → 너무 커짐)
7. `bea8920` 상단 바를 2배 확대분의 70% 수준으로 재조정 (최종 크기)

**DB 직접 반영 작업** (코드 커밋과 별개로, 로컬 DB + Atlas 운영 DB 양쪽에 스크립트로 직접 실행):
- `극단 더폼` 문서 삭제
- 극단 연극패청년 단체사진 업로드(Cloudinary) 후 `imageUrl` 갱신: `https://res.cloudinary.com/dcyrw85bi/image/upload/v1786770865/xpuyysil1m1qn7jkmtnd.png`
- 극단 5곳(놀이터/아해/좋은사람들/연극패청년/함바꿈) 전체에 `socialLinks.website`/`socialLinks.instagram` 채움 (프론트는 이미 아이콘 렌더링 로직이 있었어서 데이터만 채우면 바로 노출됨)
- Atlas DB에서 발견된 예전 v0 스캐폴딩 잔재 데이터 정리: 중복 극단 `극단 연극패 청년`(띄어쓰기 버전), 가짜 공연장 `대학로 소극장` 삭제

## 3. 알려진 이슈 / 기술 부채

- `backend/src/scripts/seed-admin.ts`가 계정 생성 성공 후 `process.exit(0)`을 호출하지 않아 스크립트가 안 끝나고 멈춤(성공 로그는 찍힘). 아직 코드 수정 안 함, 실행할 때는 성공 메시지만 확인하고 별도 명령으로 넘어가면 됨.
- 헤더 상단 바 크기 관련 값들(`h-11`, 로고 `h-8`/`h-7` 등, 그리고 18개 하위 페이지의 `pt-[8.25rem]`)은 서로 맞물려 있음 — 상단 바 높이를 또 바꾸면 그 18개 파일의 `pt-[...]` 값도 같이 조정해야 레이아웃이 깨지지 않음. 대상 파일 목록은 `grep -rl "pt-\[8.25rem\]" frontend/app`로 확인 가능.
- 실제 브라우저로 배포 결과를 직접 확인하지 못했음(사용자가 스크린샷으로 확인/전달하는 방식으로 진행). 다음 세션에서 브라우저 자동화 도구가 있으면 직접 확인 권장.

## 4. 다음 할 일 (우선순위 순, `festival-site-improvement-plan.md` 기준)

1. **Phase 3-1**: 극단 공개 페이지(`/theater-groups` 목록 + 상세) — 현재 홈 히어로 모달이 유일한 노출 경로
2. **Phase 3-2**: 극단이 공연 준비 영상(유튜브 링크+미리보기)/사진을 직접 업로드하는 기능 — Cloudinary 계정은 이미 연동 준비됨
3. **Phase 4**: 히어로 배경 사진 crossfade 효과
4. 미해결 확인사항(사용자 답변 필요): 낭독극 정확한 장소, "제24회" 표기 여부 — `layout.tsx` 메타데이터에 이미 "제24회"로 박혀있어서 답변에 따라 수정 필요할 수 있음
5. Phase 6/7 나머지: 모바일 하단 CTA, SEO(sitemap/robots/JSON-LD), `/privacy` `/terms` 실제 페이지

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
```
