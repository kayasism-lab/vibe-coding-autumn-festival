# or.kr 도메인 이전 가이드

> 목적: 구글 검색에 `vercel.app`이 노출되는 문제를 없애고 `or.kr` 대표 도메인으로 옮기되,
> **SNS·보도자료에 이미 뿌려둔 기존 주소로 들어와도 아무 조치 없이 사이트가 열리게** 한다.

대표 주소: `https://www.jik-autumn-festival.or.kr` (2026-09-07 이전, **www 포함이 대표**)
옛 주소: `https://jik-autumn-festival.vercel.app` — **삭제하지 않고** 301 자동 이동으로 살려둠

## 진행 현황 (2026-09-07 — 이전 완료)

| 단계 | 상태 | 비고 |
|---|---|---|
| 1. or.kr 도메인 등록 | ✅ | 가비아, **2027-09-07 만료 — 갱신 필수** |
| 2. Vercel 도메인 연결 | ✅ | HTTPS 인증서 자동 발급, www가 대표(Primary) |
| 3. 가비아 DNS 설정 | ✅ | A `216.198.79.1` / CNAME `www` / TXT(구글 소유확인) |
| 4. 환경변수·코드 반영 | ✅ | `NEXT_PUBLIC_SITE_URL` = `https://www.jik-autumn-festival.or.kr` |
| 5. 검증 | ✅ | 옛 주소 → 새 주소 301 이동, 하위 경로 유지 확인 |
| 6. 검색엔진 이전 | ✅ | 구글·네이버 완료, 다음 검토중 |

> **지우면 안 되는 것 세 가지**
> 1. Vercel Domains의 `jik-autumn-festival.vercel.app` — 지우면 SNS에 뿌린 링크가 전부 죽는다
> 2. 가비아 DNS의 TXT 레코드 — 구글 소유확인이 풀리고 주소 변경 신고까지 무효가 된다
> 3. 코드의 옛 네이버 인증 코드 — 옛 사이트의 소유확인이 풀린다

> **남은 일**
> - 네이버 검색광고: 비즈채널 승인 후 기존 광고그룹 OFF (자세한 내용은 `handoff.md` 2-18)
> - Cloudtype `FRONTEND_ORIGIN`을 새 주소로 갱신
> - 색인 이전은 2~8주 소요. 그 전까지 검색결과에 옛 주소가 보여도 정상
---

## 동작 방식 요약

```
방문자가 옛 주소 클릭
   https://jik-autumn-festival.vercel.app/programs
              ↓  (301 영구 이동 · 자동)
   https://www.jik-autumn-festival.or.kr/programs   ← 같은 경로 그대로 열림
```

- 옛 주소는 **삭제하지 않고 그대로 살려둡니다.** 링크가 죽지 않습니다.
- 301(영구 이동)이라 구글이 색인을 새 도메인으로 옮겨줍니다. 보통 2~8주 걸립니다.
- 이 규칙은 `frontend/next.config.mjs`의 `redirects()`에 이미 들어가 있고,
  **`NEXT_PUBLIC_SITE_URL` 환경변수가 or.kr로 바뀌는 순간 자동으로 켜집니다.**
  지금은 꺼져 있어 아무 영향이 없습니다.

---

## 1단계. or.kr 도메인 등록 — ✅ 완료 (2026-09-07)

| 항목 | 값 |
|---|---|
| 도메인 | `jik-autumn-festival.or.kr` |
| 등록처 | 가비아 (My가비아 → 서비스 관리) |
| 등록 기간 | 2026-09-07 ~ 2027-09-07 |
| 갱신 비용 | 21,000원/년 |

> ⚠️ **만료되면 사이트 전체가 죽습니다.** 가비아 My가비아에서 자동 연장을 켜두거나,
> 2027년 8월 말 알림이 오도록 캘린더에 등록해두세요.

---

## 2단계. Vercel에 도메인 연결

1. Vercel 대시보드 → 해당 프로젝트 → **Settings** → **Domains**
2. **Add** 버튼 → 구입한 도메인(예: `jik-autumn-festival.or.kr`) 입력 → Add
3. 화면에 뜨는 DNS 설정값을 메모합니다. 보통 아래 둘 중 하나입니다.

| 유형 | 호스트 | 값 |
|---|---|---|
| A 레코드 (루트 도메인용) | `@` | `76.76.21.21` |
| CNAME (www 등 서브도메인용) | `www` | `cname.vercel-dns.com` |

> 실제 값은 Vercel 화면에 표시된 것을 그대로 쓰세요. 위 값은 바뀔 수 있습니다.

**`vercel.app` 주소는 여기서 지우지 마세요.** 그대로 두면 자동 이동이 동작합니다.

---

## 3단계. 가비아에서 DNS 설정

### 화면 찾아가는 길

**My가비아 → 서비스 관리 → 도메인 목록에서 `jik-autumn-festival.or.kr`의 [관리] 버튼
→ 좌측 `DNS 정보` → `DNS 관리` (또는 상단의 `DNS 관리툴`)**

### 등록할 레코드

`DNS 관리툴` → 도메인 선택 → `DNS 설정` → **[레코드 수정]** 버튼을 누르면 표가 편집 모드가 됩니다.
`+ 추가` 를 눌러 아래 두 줄을 넣고 **[저장]** 을 누르세요.

| 타입 | 호스트 | 값/위치 | TTL |
|---|---|---|---|
| `A` | `@` | 2단계에서 Vercel이 알려준 IP | `3600` |
| `CNAME` | `www` | `cname.vercel-dns.com.` | `3600` |

> **호스트 `@`** 는 "주소 맨 앞에 아무것도 안 붙은 상태", 즉 `jik-autumn-festival.or.kr`
> 자기 자신을 뜻합니다. 가비아에서는 빈칸으로 두면 자동으로 `@`가 됩니다.
>
> **CNAME 값 끝의 점(`.`)을 빠뜨리지 마세요.** 가비아는 점이 없으면 뒤에 도메인을
> 한 번 더 붙여버려서 `cname.vercel-dns.com.jik-autumn-festival.or.kr` 같은
> 엉뚱한 주소가 됩니다.

### 주의: IP는 반드시 Vercel 화면에 뜬 값을 쓰세요

인터넷 검색에 나오는 `76.76.21.21`은 예전 값입니다. Vercel은 요즘 프로젝트마다
다른 IP(예: `216.198.79.1`)를 배정하므로, **2단계에서 본인 화면에 표시된 값**을
그대로 옮겨 적어야 합니다.

### 반영 확인 (PowerShell)

설정 후 반영까지 **10분~최대 24시간** 걸립니다. 아래로 확인할 수 있습니다.

```powershell
Resolve-DnsName jik-autumn-festival.or.kr -Server 8.8.8.8
```

Vercel Domains 화면에 초록색 **Valid Configuration**이 뜨면 완료입니다.
HTTPS 인증서는 Vercel이 자동 발급하므로 따로 하실 일이 없습니다.


## 4단계. 환경변수 변경 (여기가 핵심)

도메인이 연결되어 정상적으로 열리는 것을 확인한 **뒤에** 진행하세요.
순서를 바꾸면 접속이 안 되는 시간이 생깁니다.

### Vercel (프론트엔드)

Settings → Environment Variables

| 변수명 | 새 값 | 적용 환경 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.jik-autumn-festival.or.kr` | **Production만** 체크 |

> ⚠️ Preview/Development에는 체크하지 마세요. 미리보기 배포까지 옛 주소에서
> 이동해버려 배포 전 확인이 불가능해집니다.
> (안전장치로 코드에서도 프로덕션 배포에서만 동작하도록 막아뒀습니다.)

이 값 하나가 사이트 주소, 검색엔진용 canonical 태그, `sitemap.xml`,
`robots.txt`, 카카오톡·페이스북 공유 미리보기 주소를 **전부** 새 도메인으로 바꿉니다.

### Cloudtype (백엔드)

| 변수명 | 새 값 |
|---|---|
| `FRONTEND_ORIGIN` | `https://www.jik-autumn-festival.or.kr` |

> 실제로 API는 Next.js가 서버끼리 중계(`/api/*` rewrite)하므로 이 값이 틀려도
> 당장 사이트가 멈추지는 않습니다. 다만 값을 맞춰두지 않으면 나중에 원인을
> 찾기 어려운 문제가 생기니 같이 바꿔주세요.

### 재배포

환경변수는 **저장만으로는 반영되지 않습니다.**

- Vercel: Deployments → 최신 배포의 `...` → **Redeploy**
- Cloudtype: 재시작 또는 재배포

---

## 5단계. 확인 (PowerShell)

```powershell
# 1) 새 주소가 정상(200)으로 열리는지
curl.exe -I https://www.jik-autumn-festival.or.kr

# 2) 옛 주소가 새 주소로 301 이동하는지  ← 가장 중요
curl.exe -I https://jik-autumn-festival.vercel.app
#   기대: HTTP/2 308  또는 301
#         location: https://www.jik-autumn-festival.or.kr/

# 3) 하위 경로도 같은 경로로 따라가는지
curl.exe -I https://jik-autumn-festival.vercel.app/programs
#   기대: location: https://www.jik-autumn-festival.or.kr/programs

# 4) 검색엔진용 파일이 새 주소를 가리키는지
curl.exe https://www.jik-autumn-festival.or.kr/robots.txt
curl.exe https://www.jik-autumn-festival.or.kr/sitemap.xml
```

### 눈으로 확인할 것

- [ ] 옛 주소를 브라우저에 붙여넣으면 주소창이 자동으로 or.kr로 바뀌는가
- [ ] 관리자 로그인(`/admin/login`)이 새 주소에서 정상 동작하는가
- [ ] 신청서 작성·제출이 새 주소에서 정상 동작하는가
- [ ] 카카오톡에 새 주소를 붙여넣었을 때 미리보기 이미지가 뜨는가

> 로그인 쿠키는 도메인별로 따로 저장됩니다. 도메인 이전 후 관리자 화면에서
> 로그아웃 상태로 보이는 것은 정상이며, 새 주소에서 다시 로그인하면 됩니다.

---

## 6단계. 검색엔진 이전 처리

301만 걸어둬도 결국 옮겨지지만, 아래를 하면 훨씬 빨라집니다.

### 구글 서치 콘솔
1. 새 도메인을 **속성 추가** → URL 접두어에 `https://www.jik-autumn-festival.or.kr` 입력
2. 소유권 확인 (Vercel에 DNS TXT 레코드 추가 또는 HTML 파일 방식)
3. `sitemap.xml` 제출
4. 기존 vercel.app 속성에서 **설정 → 주소 변경** 도구로 새 도메인 지정
   (이 도구가 색인 이전을 가장 빠르게 만듭니다)

### 네이버 서치어드바이저
- 새 도메인으로 사이트 등록 → 소유권 확인 → `sitemap.xml` 제출

### 그 외 바꿔야 할 곳
- [ ] SNS 프로필 링크 (인스타그램 등)
- [ ] 보도자료 (`docs/press-kit-2026.md`)
- [ ] 각 극단 홈페이지에 걸린 링크
- [ ] `docs/seo-guide.md`, `docs/handoff.md`의 주소 표기

---

## 되돌리는 방법

문제가 생기면 Vercel 환경변수 `NEXT_PUBLIC_SITE_URL`을 **삭제하고 재배포**하면
자동 이동이 꺼지고 원래 상태로 돌아갑니다. 코드 수정은 필요 없습니다.
