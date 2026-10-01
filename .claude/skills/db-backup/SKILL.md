---
name: db-backup
description: 운영(MongoDB Atlas) DB 전체를 백업하거나 백업에서 복구한다. "DB 백업해줘", "상용 DB 백업", "운영 데이터 복구", "백업에서 되살려줘" 같은 요청에 사용한다.
---

# 운영 DB 백업·복구

2026-10-02에 만든 방식이다. `mongodump`가 설치돼 있지 않아 Node 드라이버(backend의 mongoose)로
직접 읽고 쓴다. ObjectId·Date 형식이 그대로 살아나도록 **EJSON**으로 저장한다.

## 1. 백업 (읽기 전용 — 언제 해도 안전)

```bash
node .claude/skills/db-backup/scripts/backup.cjs          # 운영 DB
node .claude/skills/db-backup/scripts/backup.cjs local    # 로컬 DB
```
- 운영 DB 주소는 `백엔드환경값.txt`에서 읽는다. **주소·비밀번호를 화면에 출력하지 말 것**
- 결과: `db-backups/full/<atlas|local>-<한국시각>/`
  - `<컬렉션>.ejson`(문서 전체), `_indexes.json`(인덱스), `_manifest.json`(건수)
- `db-backups/`는 git 제외 폴더다. **비밀번호 해시·개인정보가 들어 있으니 외부 공유 금지**
- 위험한 운영 작업(일괄 수정, 마이그레이션, 데이터 삭제) **전에는 반드시 먼저 백업**한다

## 2. 복구

```bash
# 복구 시험 (로컬의 별도 DB에 되살려 보기 — 확인 후 그 DB는 지운다)
node .claude/skills/db-backup/scripts/restore.cjs db-backups/full/<폴더> --db autumn_festival_restore_test

# 로컬 DB를 운영 백업으로 맞추기
node .claude/skills/db-backup/scripts/restore.cjs db-backups/full/<폴더>

# 특정 컬렉션만
node .claude/skills/db-backup/scripts/restore.cjs db-backups/full/<폴더> --only citizenapplications

# 운영 DB에 복구 — 사용자 명시 승인 필수
node .claude/skills/db-backup/scripts/restore.cjs db-backups/full/<폴더> --to-production
```
- 복구는 대상 컬렉션을 **지우고 백업 내용으로 통째로 바꾼다.** 백업 이후 생긴 데이터는 사라진다
- `--to-production`은 **사용자가 채팅에서 명시적으로 승인했을 때만** 쓴다. 쓰기 직전에 지금 운영
  상태를 한 번 더 백업해 둔다(복구를 되돌릴 수 있도록)
- 끝에 컬렉션별 "백업 / 복구 후" 건수를 대조해 보여준다

## 3. 백업에 들어가지 않는 것

- **사진·첨부파일**: Cloudinary에 있다. DB에는 주소만 있으므로 파일 자체는 Cloudinary 쪽에서 관리
- 서버 환경값(`백엔드환경값.txt`, Cloudtype·Vercel 설정)

## 4. 기록

| 날짜 | 폴더 | 내용 |
|---|---|---|
| 2026-10-02 | `atlas-2026-10-02T01-41` | 첫 전체 백업. 17개 컬렉션 147건. 시험 DB 복구로 건수·형식 확인 |
