// 운영(또는 로컬) DB에서 시민참여 신청을 **읽기만** 해서 JSON으로 저장한다.
// 신청자 비밀번호 필드는 아예 가져오지 않는다. 결과는 git 제외 폴더(db-backups/)에만 둔다.
//
// 사용: node .claude/skills/applicant-pdf/scripts/read-applicants.cjs <공연유형> [상태목록] [local]
//   공연유형: short_play(열린 단막극) | reading(열린 낭독극)
//   상태목록: 쉼표로 구분. 기본 pending (예: pending,approved)
//   local  : 붙이면 로컬 DB, 없으면 운영 DB(백엔드환경값.txt의 MONGODB_URI)
const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const ROOT = path.resolve(__dirname, '../../../..')
const mongoose = createRequire(path.join(ROOT, 'backend/package.json'))('mongoose')

const [programType, statusArg = 'pending', target] = process.argv.slice(2)
if (!['short_play', 'reading'].includes(programType)) {
  console.error('공연유형은 short_play 또는 reading 이어야 합니다.')
  process.exit(1)
}
const statuses = statusArg.split(',').map((s) => s.trim())

// 운영 DB 주소는 비밀값 파일에서 읽고 화면에는 출력하지 않는다
const uri =
  target === 'local'
    ? 'mongodb://localhost:27017/autumn_festival'
    : fs.readFileSync(path.join(ROOT, '백엔드환경값.txt'), 'utf-8').match(/MONGODB_URI\s*[=:]\s*(\S+)/)?.[1]
if (!uri) throw new Error('MONGODB_URI를 찾지 못했습니다.')

;(async () => {
  await mongoose.connect(uri)
  const col = mongoose.connection.db.collection('citizenapplications')

  const byStatus = await col
    .aggregate([{ $match: { programType } }, { $group: { _id: '$status', n: { $sum: 1 } } }])
    .toArray()
  console.log('상태별 건수:', byStatus.map((s) => `${s._id} ${s.n}`).join(', '))

  const docs = await col
    .find({ programType, status: { $in: statuses } }, { projection: { password: 0 } })
    .sort({ createdAt: 1 })
    .toArray()

  // 한국 시각 기준 날짜를 파일 이름에 쓴다
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
  const outDir = path.join(ROOT, 'db-backups', `${programType}-applicants`)
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `${statuses.join('+')}-${today}.json`)
  fs.writeFileSync(outFile, JSON.stringify(docs, null, 2))

  console.log(`${statuses.join(',')} ${docs.length}명 저장 → ${outFile}`)
  console.log('나이:', docs.map((d) => d.age).join(','))
  await mongoose.disconnect()
})()
