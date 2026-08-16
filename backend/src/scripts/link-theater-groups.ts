// 극단 소유 관계를 이름(문자열)에서 ID 참조로 옮기는 마이그레이션.
// - Program.company 와 이름이 일치하는 극단을 찾아 Program.theaterGroup 을 채운다
// - User.theaterGroupName 과 일치하는 극단을 찾아 User.theaterGroup 을 채운다
// 이미 연결된 문서는 건드리지 않으므로 여러 번 실행해도 안전하다.
// 운영 DB에 반영할 때도 같은 스크립트를 사용한다: npm run migrate:groups --workspace backend

import { connectDB } from '../lib/db.js'
import { Program, TheaterGroup, User } from '../models/index.js'

await connectDB()

const groups = await TheaterGroup.find().select('name').lean<{ _id: unknown; name: string }[]>()
const groupIdByName = new Map(groups.map((group) => [group.name, group._id]))

console.log(`등록된 극단 ${groups.length}개를 기준으로 연결합니다.`)

// 1) 작품 → 소유 극단
const programs = await Program.find({ theaterGroup: { $exists: false } })
  .select('title company')
  .lean<{ _id: unknown; title: string; company: string }[]>()

let linkedPrograms = 0
const unmatchedCompanies = new Set<string>()

for (const program of programs) {
  const groupId = groupIdByName.get(program.company)
  if (!groupId) {
    // 협의회가 직접 주관하는 프로그램은 소유 극단이 없는 것이 정상이다
    unmatchedCompanies.add(program.company)
    continue
  }

  await Program.updateOne({ _id: program._id }, { $set: { theaterGroup: groupId } })
  linkedPrograms += 1
  console.log(`  작품 연결: ${program.title} → ${program.company}`)
}

// 2) 극단 담당자 계정 → 담당 극단
const groupUsers = await User.find({ role: 'group', theaterGroup: { $exists: false } })
  .select('name theaterGroupName')
  .lean<{ _id: unknown; name: string; theaterGroupName: string }[]>()

let linkedUsers = 0
const unmatchedUsers: string[] = []

for (const user of groupUsers) {
  const groupId = groupIdByName.get(user.theaterGroupName)
  if (!groupId) {
    unmatchedUsers.push(`${user.name}(${user.theaterGroupName})`)
    continue
  }

  await User.updateOne({ _id: user._id }, { $set: { theaterGroup: groupId } })
  linkedUsers += 1
  console.log(`  계정 연결: ${user.name} → ${user.theaterGroupName}`)
}

// 3) permissions 필드가 없는 기존 계정 보정
const permissionResult = await User.updateMany(
  { permissions: { $exists: false } },
  { $set: { permissions: [] } }
)

console.log('\n--- 결과 ---')
console.log(`작품 연결: ${linkedPrograms}건`)
console.log(`계정 연결: ${linkedUsers}건`)
console.log(`permissions 초기화: ${permissionResult.modifiedCount}건`)

if (unmatchedCompanies.size > 0) {
  console.log(`\n소유 극단 없이 남긴 작품 주관처: ${[...unmatchedCompanies].join(', ')}`)
  console.log('(협의회 직접 주관 프로그램이라면 정상입니다)')
}

if (unmatchedUsers.length > 0) {
  console.log(`\n[확인 필요] 극단을 찾지 못한 담당자 계정: ${unmatchedUsers.join(', ')}`)
  console.log('사용자 관리에서 담당 극단을 다시 지정해주세요.')
}

process.exit(0)
