// 운영(또는 로컬) DB의 모든 컬렉션을 **읽기만** 해서 통째로 백업한다.
// mongodump가 설치돼 있지 않아 드라이버로 직접 내려받는다.
// ObjectId·Date 같은 형식이 복구 때 그대로 살아나도록 EJSON(relaxed: false)으로 저장한다.
//
// 사용: node .claude/skills/db-backup/scripts/backup.cjs [local]
//   local을 붙이면 로컬 DB, 없으면 운영 DB(백엔드환경값.txt의 MONGODB_URI)
// 결과: db-backups/full/<atlas|local>-<한국시각>/
//   <컬렉션>.ejson  문서 전체 (비밀번호 해시 포함 → 외부 공유 금지, git 제외 폴더)
//   _indexes.json   컬렉션별 인덱스 정의 (복구 때 다시 만든다)
//   _manifest.json  백업 시각·DB 이름·컬렉션별 건수 (복구 후 대조용)
const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const ROOT = path.resolve(__dirname, '../../../..')
const mongoose = createRequire(path.join(ROOT, 'backend/package.json'))('mongoose')
const { EJSON } = mongoose.mongo.BSON

const target = process.argv[2] === 'local' ? 'local' : 'atlas'

// 운영 DB 주소는 비밀값 파일에서 읽고 화면에는 출력하지 않는다
const uri =
  target === 'local'
    ? 'mongodb://localhost:27017/autumn_festival'
    : fs.readFileSync(path.join(ROOT, '백엔드환경값.txt'), 'utf-8').match(/MONGODB_URI\s*[=:]\s*(\S+)/)?.[1]
if (!uri) throw new Error('MONGODB_URI를 찾지 못했습니다.')

;(async () => {
  await mongoose.connect(uri)
  const db = mongoose.connection.db

  // 한국 시각을 폴더 이름에 쓴다 (예: 2026-10-02T21-05)
  const stamp = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(':', '-')
  const outDir = path.join(ROOT, 'db-backups', 'full', `${target}-${stamp}`)
  fs.mkdirSync(outDir, { recursive: true })

  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .sort()

  const manifest = { target, dbName: db.databaseName, backedUpAt: new Date().toISOString(), counts: {} }
  const indexes = {}

  for (const name of collections) {
    const docs = await db.collection(name).find({}).toArray()
    fs.writeFileSync(path.join(outDir, `${name}.ejson`), EJSON.stringify(docs, null, 0, { relaxed: false }))
    // 기본 _id 인덱스는 컬렉션이 생길 때 저절로 생기므로 빼고 저장한다
    indexes[name] = (await db.collection(name).indexes()).filter((ix) => ix.name !== '_id_')
    manifest.counts[name] = docs.length
    console.log(`${name.padEnd(22)} ${docs.length}건`)
  }

  fs.writeFileSync(path.join(outDir, '_indexes.json'), JSON.stringify(indexes, null, 2))
  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2))

  const total = Object.values(manifest.counts).reduce((a, b) => a + b, 0)
  console.log(`\n컬렉션 ${collections.length}개, 문서 ${total}건 저장 → ${outDir}`)
  await mongoose.disconnect()
})().catch(async (err) => {
  console.error('백업 실패:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
