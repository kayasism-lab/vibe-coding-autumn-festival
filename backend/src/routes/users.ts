import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const usersRouter = Router()
const roles = ['superadmin', 'admin', 'group', 'normal']

usersRouter.use(requireAdmin)

function sanitize(user: Record<string, unknown>) {
  const { password, refreshToken, ...safe } = user
  return safe
}

usersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 }).lean()
    ok(res, users)
  })
)

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, phone, theaterGroupName, password, role } = req.body
    if (!name || !email || !phone || !password) {
      fail(res, '이름, 이메일, 연락처, 비밀번호를 입력해주세요.', 400)
      return
    }
    if (role && !roles.includes(role)) {
      fail(res, '올바르지 않은 사용자 타입입니다.', 400)
      return
    }

    const exists = await User.findOne({ email })
    if (exists) {
      fail(res, '이미 가입된 이메일입니다.', 409)
      return
    }

    const user = await User.create({
      name,
      email,
      phone,
      theaterGroupName: theaterGroupName || '없음',
      password: await bcrypt.hash(password, 12),
      role: role || 'normal',
    })

    ok(res, sanitize(user.toObject()), '사용자가 등록되었습니다.', 201)
  })
)

usersRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.body.role && !roles.includes(req.body.role)) {
      fail(res, '올바르지 않은 사용자 타입입니다.', 400)
      return
    }

    const update: Record<string, unknown> = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      theaterGroupName: req.body.theaterGroupName || '없음',
      role: req.body.role,
    }

    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 12)
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password -refreshToken')
      .lean()

    if (!user) {
      fail(res, '사용자를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, user, '사용자 정보가 수정되었습니다.')
  })
)

usersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      fail(res, '사용자를 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '사용자가 삭제되었습니다.')
  })
)
