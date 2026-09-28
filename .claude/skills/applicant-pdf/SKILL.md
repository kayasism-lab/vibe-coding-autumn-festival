---
name: applicant-pdf
description: 시민참여 신청자(열린 단막극·열린 낭독극) 정보를 운영 DB에서 읽어 한 사람당 한 쪽짜리 PDF로 정리한다. "신청자 PDF", "신청자 정리해서 PDF", "심사중 신청자 뽑아줘", "나이대별로 나눠서 PDF" 같은 요청에 사용한다. 그 밖의 한글 문서를 PDF로 만들 때도 5절의 HTML→Edge 변환 방법을 참고한다.
---

# 시민참여 신청자 PDF 만들기

2026-09-28에 처음 만든 방식이다. 결과물 예:
`db-backups/short_play-applicants/열린단막극_심사중_신청자_<날짜>.pdf`
(표지 → 섹션별 명단 → 신청자 한 명당 한 쪽) + 개인용 연락처 md
섹션: 나이 구간(기본 50세 미만 / 50~60세 미만 / 60세 이상) + 직연협 회원극단 단원

## 0. 먼저 사용자에게 확인할 것 (정해지지 않았을 때만)

| 항목 | 기본값 | 선택지 |
|---|---|---|
| 공연 유형 | — (꼭 확인) | `short_play`(열린 단막극) / `reading`(열린 낭독극) |
| 상태 | `pending`(심사중) | `pending`, `approved`, `rejected`를 쉼표로 조합 |
| 나이 구간 | `50,60` | 경계를 쉼표로. `none`이면 나누지 않음 |

"반려 제외"라고 하면 보통 `pending`(심사중)만이다. 승인된 사람도 넣을지 애매하면 물어볼 것.

## 1. 운영 DB에서 읽기 (읽기 전용)

```bash
node .claude/skills/applicant-pdf/scripts/read-applicants.cjs short_play pending
```
- 운영 DB 주소는 `백엔드환경값.txt`에서 읽는다. **주소·비밀번호를 화면에 출력하지 말 것**
- 신청자 비밀번호 필드는 가져오지 않는다
- 결과: `db-backups/<공연유형>-applicants/<상태>-<날짜>.json` (git 제외 폴더)
- 마지막 인자에 `local`을 붙이면 로컬 DB

## 2. PDF 만들기

```bash
node .claude/skills/applicant-pdf/scripts/make-report.cjs db-backups/short_play-applicants/pending-<날짜>.json 50,60
```
- HTML을 만든 뒤 **Edge 헤드리스 인쇄**로 PDF를 만들고, 중간 HTML은 지운다
- **PDF에는 연락처·이메일을 싣지 않는다**(09-28 사용자 요청). 답변·문의 글 속 전화번호·이메일도
  `[연락처 가림]`으로 바꾼다. 연락처는 **같은 폴더의 `..._연락처_<날짜>.md`**(사용자 개인용)에만
  섹션·PDF 쪽 번호와 함께 담긴다
- **직연협 회원극단 단원**("직연협…회원극단" 예/아니오 질문에 `예`)은 나이와 상관없이 마지막
  섹션에 모으고 소속 극단 칸을 보여준다. 질문은 id가 아니라 문구로 찾는다(작품마다 id가 다름)
- 한 쪽을 넘는 신청자는 글자 크기를 0.25pt씩 줄여 한 쪽에 맞춘다(최소 6.5pt)
- 질문은 신청서에 저장된 질문 스냅샷(`answeredQuestions`)을 그대로 따른다. 작품마다 질문이
  달라도 코드를 고칠 필요가 없다. 필수 일정 체크박스는 ☑/☐, 체크 안 한 일정은 빨간색

## 3. 검사 (반드시)

```bash
"$LOCALAPPDATA/Programs/Python/Python312/python.exe" .claude/skills/applicant-pdf/scripts/check.py <PDF> <JSON> <스크래치패드 폴더>
```
- `잘림·중복 의심 없음`과 `연락처 노출 없음`이 둘 다 나와야 한다
- 저장된 이미지(1쪽, 2쪽, 가장 긴 신청자 쪽)를 **Read로 직접 열어 눈으로 확인**할 것.
  09-28에는 긴 주소 때문에 전화번호가 두 줄로 끊긴 것을 이 단계에서 잡았다(`.nw` 줄바꿈 금지로 해결)
- 확인용 이미지는 스크래치패드에만 두고, 끝나면 지운다

## 4. 개인정보 원칙

- 결과는 `db-backups/`(git 제외)에만 둔다. **아티팩트로 게시하거나 외부로 보내지 말 것**
- 표지에 "외부 공유 금지" 문구가 들어간다
- 운영 DB에 **쓰는** 작업(계정 생성 등)은 자동 모드에서 막힌다. 이 스킬은 읽기만 한다

## 5. 다른 한글 PDF를 만들 때 (범용)

- **HTML + CSS로 만들고 Edge로 변환하는 것이 가장 쉽다.** 맑은 고딕이 그대로 나온다
  ```bash
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu \
    --no-pdf-header-footer --virtual-time-budget=10000 --user-data-dir="<임시폴더>" \
    --print-to-pdf="<출력.pdf>" "file:///<입력.html>"
  ```
- 쪽 나누기: `@page { size: A4; margin: 0 }` + 쪽마다 `height: 297mm; page-break-after: always`
- 한 쪽에 맞추기: `make-report.cjs`의 `fitScript`(넘치면 글자 크기 줄이기)를 가져다 쓴다
- 표·양식이 복잡하지 않고 코드로 그리는 편이 낫다면 Python `reportlab`도 설치돼 있다
  (한글은 `C:/Windows/Fonts/malgun.ttf`를 `TTFont`로 등록해야 한다)
- 설치된 도구: Python 3.12(`%LOCALAPPDATA%\Programs\Python\Python312`), reportlab, pypdf,
  pdfplumber, pypdfium2, pillow. Edge는 Windows 기본 설치
