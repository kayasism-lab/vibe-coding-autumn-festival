import mongoose from 'mongoose'
import { env } from './env.js'

// 요청 본문·쿼리에 { $ne: null } 같은 질의 연산자를 넣어 필터를 넓히는
// NoSQL 주입을 전역에서 막는다. 사용자 입력이 필터 값으로 들어와도
// 연산자로 해석되지 않고 일반 값으로 다뤄진다.
//
// ※ 주의: 이 설정은 '코드가 직접 쓴 연산자'도 가리지 않고 막는다.
//   find({ date: { $gte: x } })처럼 쓰면 { date: { $eq: { $gte: x } } }로 바뀌어
//   조회가 통째로 실패한다($and·$or 안쪽까지 훑는다).
//   조건을 코드에서 만들 때는 값을 먼저 검증한 뒤 mongoose.trusted()로 감쌀 것.
//   (2026-09-21: 이걸 몰라 공지 게시판·일정 조회가 500으로 죽어 있었다)
mongoose.set('sanitizeFilter', true)

let cached: typeof mongoose | null = null

export async function connectDB() {
  if (cached) {
    return cached
  }

  cached = await mongoose.connect(env.mongodbUri, {
    bufferCommands: false,
  })

  return cached
}
