import bcrypt from 'bcryptjs'
import { connectDB } from '../lib/db.js'
import { User } from '../models/index.js'

await connectDB()

const email = process.env.ADMIN_EMAIL || 'admin@festival.com'
const password = process.env.ADMIN_PASSWORD || 'admin1234'
const role = process.env.ADMIN_ROLE || 'superadmin'

const existingAdmin = await User.findOne({ email })

if (existingAdmin) {
  console.log(`관리자 계정이 이미 존재합니다: ${email}`)
  process.exit(0)
}

await User.create({
  email,
  password: await bcrypt.hash(password, 12),
  name: '축제 관리자',
  phone: '010-0000-0000',
  theaterGroupName: '없음',
  role,
})

console.log(`관리자 계정을 생성했습니다: ${email}`)
process.exit(0)
