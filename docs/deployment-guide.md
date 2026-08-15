# 배포 가이드 (Vercel + Cloudtype)

이 문서는 코드에서 실제로 참조하는 환경변수만 근거로 작성했습니다
(`backend/src/lib/env.ts`, `frontend/next.config.mjs`, `frontend/components/admin/cloudinary-upload.tsx` 기준).
로그인/대시보드 클릭이 필요한 단계는 직접 하셔야 합니다 — 그 부분은 아래에 명확히 표시했습니다.

GitHub 저장소: https://github.com/kayasism-lab/vibe-coding-autumn-festival (비공개)

---

## 배포 순서 (중요)

백엔드와 프론트가 서로의 주소를 알아야 하므로 **백엔드를 먼저 배포**하는 것을 권장합니다.

1. MongoDB Atlas(또는 접근 가능한 MongoDB) 준비
2. Cloudtype에 `backend` 배포 → 백엔드 URL 확보
3. Vercel에 `frontend` 배포 (2번에서 얻은 URL을 `API_BASE_URL`로 사용)
4. Vercel에서 최종 확정된 프론트 URL을 Cloudtype의 `FRONTEND_ORIGIN`에 반영(필요 시 수정 후 재배포)

---

## 1. Cloudtype — 백엔드 배포

### 기본 설정

| 항목 | 값 |
|---|---|
| Root Directory | `backend` |
| Install Command | `npm install` |
| Build Command | `npm run build` (tsc → `dist/`) |
| Start Command | `npm start` (`node dist/server.js`) |
| Port | 앱이 `process.env.PORT`를 우선 사용하도록 되어 있어(`backend/src/lib/env.ts`), Cloudtype가 자동 주입하는 포트를 그대로 씁니다. |

### 환경변수

| 변수명 | 값 | 비고 |
|---|---|---|
| `NODE_ENV` | `production` | 반드시 설정 — 아래 시크릿 값들이 기본값(fallback)으로 새는 것을 막는 안전장치가 이 값에 의존합니다 |
| `MONGODB_URI` | (직접 준비 필요) | 로컬 `mongodb://localhost:27017`는 Cloudtype 서버에서 접근 불가. **MongoDB Atlas 무료 클러스터**를 만들고 그 연결 문자열을 넣어야 합니다. 이 부분은 계정 생성이 필요해 제가 대신 할 수 없습니다. |
| `FRONTEND_ORIGIN` | 배포된 Vercel 주소 (예: `https://vibe-coding-autumn-festival.vercel.app`) | 1단계에서는 예상 주소를 넣고, 프론트 배포 후 실제 주소로 다시 확인/수정 |
| `JWT_SECRET` | 임의의 긴 무작위 문자열 | 예: `openssl rand -hex 32` 또는 비밀번호 생성기로 32자 이상 생성 |
| `JWT_REFRESH_SECRET` | 임의의 긴 무작위 문자열(JWT_SECRET과 다른 값) | 위와 동일한 방식으로 별도 생성 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | (선택) | `npm run seed:admin` 스크립트를 배포 서버에서 한 번 실행할 계획이면 지정. 런타임에는 사용되지 않음 |

> `JWT_SECRET`/`JWT_REFRESH_SECRET`는 코드에 기본값(fallback)이 있지만, `NODE_ENV=production`일 때 기본값 그대로 두면 서버가 시작하지 않고 에러를 던지도록 이미 안전장치가 되어 있습니다(`backend/src/lib/env.ts`의 `required()` 함수). 즉 실제 값을 넣지 않으면 배포가 바로 실패하니, 실패하면 이 두 값을 확인하세요.

배포가 끝나면 Cloudtype이 발급하는 공개 URL(예: `https://xxxx.cloudtype.app`)을 기록해두세요. 다음 단계(Vercel)에서 필요합니다.

---

## 2. Vercel — 프론트엔드 배포

### 기본 설정

| 항목 | 값 |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js (자동 감지됨) |
| Install / Build / Output | 기본값 그대로 (오버라이드 불필요) |

### 환경변수

| 변수명 | 값 | 비고 |
|---|---|---|
| `API_BASE_URL` | 1단계에서 확보한 Cloudtype 백엔드 URL (예: `https://xxxx.cloudtype.app`) | `next.config.mjs`의 `/api/*` 리라이트가 이 주소로 프록시합니다 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | (직접 준비 필요) | Cloudinary 계정의 Cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | (직접 준비 필요) | Cloudinary의 Unsigned upload preset 이름 |

> Cloudinary 값은 이전에 shopping-mall-demo 계정을 재사용해도 되는지 여쭤봤던 부분입니다. 그 계정의
> `client/.env` 또는 Vercel 프로젝트 설정에 들어있는 `VITE_CLOUDINARY_CLOUD_NAME` /
> `VITE_CLOUDINARY_UPLOAD_PRESET` 값을 그대로 가져와 넣으시면 됩니다.

배포 후 Vercel이 확정한 실제 도메인을 Cloudtype의 `FRONTEND_ORIGIN`에 반영해주세요(1단계 표 참고).

---

## 3. 배포 후 확인 체크리스트

- [ ] `https://<vercel-domain>/` 접속 시 홈페이지가 정상 로딩되는가
- [ ] `https://<vercel-domain>/api/schedules` (Next 리라이트 경유)가 실제 일정 데이터를 반환하는가
- [ ] `/admin/login`에서 관리자 로그인이 되는가 (Cloudtype에서 `seed:admin` 실행 필요)
- [ ] 관리자에서 이미지 업로드(Cloudinary 위젯)가 정상 동작하는가
- [ ] 로그인 쿠키가 유지되는가 (로그인 후 새로고침해도 관리자 화면 유지)

## 4. 로컬 개발 환경과의 차이

로컬은 `backend/.env.example` / `frontend/.env.example` 값을 기준으로 동작하며 MongoDB도 로컬 인스턴스를
사용합니다. 배포 환경은 위 표의 값으로 완전히 분리되어 있으므로, 로컬 `.env.local`/`.env` 파일은
**절대 커밋되지 않습니다** (`.gitignore`에 이미 포함됨) — 배포용 값은 각 플랫폼의 환경변수 설정 화면에
직접 입력해야 합니다.
