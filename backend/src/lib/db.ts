import mongoose from 'mongoose'
import { env } from './env.js'

// 요청 본문·쿼리에 { $ne: null } 같은 질의 연산자를 넣어 필터를 넓히는
// NoSQL 주입을 전역에서 막는다. 사용자 입력이 필터 값으로 들어와도
// 연산자로 해석되지 않고 일반 값으로 다뤄진다.
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
