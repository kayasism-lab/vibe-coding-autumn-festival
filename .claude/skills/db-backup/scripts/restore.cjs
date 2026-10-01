// backup.cjs로 만든 백업 폴더를 DB에 되살린다.
// 대상 DB의 같은 이름 컬렉션은 **지우고 백업 내용으로 통째로 바꾼다.**
//
// 사용: node .claude/skills/db-backup/scripts/restore.cjs <백업폴더> [--db <로컬DB이름>] [--only a,b] [--to-production]
//   기본 대상: 로컬 DB autumn_festival
//   --db <이름>       로컬의 다른 DB에 복구 (복구 시험용, 예: autumn_festival_restore_test)
//   --only a,b        지정한 컬렉션만 복구 (예: --only citizenapplications)
//   --to-production   운영 DB(백엔드환경값.txt)에 복구. 실수 방지를 위해 이 옵션 없이는 절대 운영에 쓰지 않는다
const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const ROOT = path.resolve(__dirname, '../../../..')
const mongoose = createRequire(path.join(ROOT, 'backend/package.json'))('mongoose')
const { EJSON } = mongoose.mongo.BSON

const args = process.argv.slice(2)
const backupDir = args[0] && path.resolve(args[0])
const optValue = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
const toProduction = args.includes('--to-production')
const localDbName = optValue('--db') || 'autumn_festival'
const only = optValue('--only')?.split(',').map((s) => s.trim())

if (!backupDir || !fs.existsSync(path.join(backupDir, '_manifest.json'))) {
  console.error('백업 폴더를 찾지 못했습니다. _manifest.json이 있는 폴더를 지정하세요.')
  process.exit(1)
}

const uri = toProduction
  ? fs.readFileSync(path.join(ROOT, '백엔드환경값.txt'), 'utf-8').match(/MONGODB_URI\s*[=:]\s*(\S+)/)?.[1]
  : `mongodb://localhost:27017/${localDbName}`
if (!uri) throw new Error('MONGODB_URI를 찾지 못했습니다.')

;(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, '_manifest.json'), 'utf-8'))
  const indexes = JSON.parse(fs.readFileSync(path.join(backupDir, '_indexes.json'), 'utf-8'))
  const names = Object.keys(manifest.counts).filter((n) => !only || only.includes(n))

  await mongoose.connect(uri)
  const db = mongoose.connection.db
  console.log(`복구 대상: ${toProduction ? '운영 DB' : '로컬 DB'} (${db.databaseName}) ← ${path.basename(backupDir)}`)

  let mismatch = 0
  for (const name of names) {
    const docs = EJSON.parse(fs.readFileSync(path.join(backupDir, `${name}.ejson`), 'utf-8'), { relaxed: false })
    const col = db.collection(name)
    await col.deleteMany({})
    if (docs.length) await col.insertMany(docs, { ordered: true })
    // 인덱스를 다시 만든다. 이미 같은 인덱스가 있으면 그대로 넘어간다
    for (const ix of indexes[name] ?? []) {
      const { key, v, ns, ...options } = ix
      await col.createIndex(key, options).catch((e) => console.warn(`  인덱스 ${ix.name} 생략: ${e.message}`))
    }
    const count = await col.countDocuments()
    const ok = count === manifest.counts[name]
    if (!ok) mismatch++
    console.log(`${ok ? '✓' : '✗'} ${name.padEnd(22)} 백업 ${manifest.counts[name]} / 복구 후 ${count}`)
  }

  console.log(mismatch ? `\n건수가 다른 컬렉션 ${mismatch}개 — 확인 필요` : '\n모든 컬렉션 건수 일치')
  await mongoose.disconnect()
})().catch(async (err) => {
  console.error('복구 실패:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
