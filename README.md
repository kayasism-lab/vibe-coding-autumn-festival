# Autumn Festival

프론트엔드와 백엔드를 분리한 로컬 개발 구조입니다.

## 구조

- `frontend`: Next.js App Router 앱. Vercel 배포 대상입니다.
- `backend`: Express + Mongoose API 서버. Cloudtype 배포 대상입니다.

## 로컬 환경

백엔드는 환경변수가 없어도 기본적으로 아래 MongoDB를 사용합니다.

```bash
mongodb://localhost:27017/autumn_festival
```

필요하면 `backend/.env.example`, `frontend/.env.example`을 기준으로 각 폴더에
`.env` 또는 `.env.local`을 만들 수 있습니다.

## 실행

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

백엔드와 프론트엔드는 각각 장기 실행 프로세스이므로 두 개의 터미널에서 실행하세요.

기본 포트는 다음과 같습니다.

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

프론트의 `/api/*` 요청은 `frontend/next.config.mjs` rewrite를 통해 백엔드의
`http://localhost:4000/api/*`로 전달됩니다.

## 관리자 계정 생성

```bash
npm run seed:admin --workspace backend
```

기본 계정은 로컬 개발용입니다.

- Email: `admin@festival.com`
- Password: `admin1234`

프로덕션에서는 `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `MONGODB_URI`, `FRONTEND_ORIGIN`을 반드시 별도로 설정하세요.

## 배포 기준

- Vercel: `frontend` 폴더를 프로젝트 루트로 지정합니다.
- Cloudtype: `backend` 폴더를 프로젝트 루트로 지정하고 `npm start`를 실행합니다.
- Vercel 환경변수 `API_BASE_URL`은 Cloudtype 백엔드 주소로 설정합니다.
