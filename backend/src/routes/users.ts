import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { TheaterGroup, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'
import { normalizeGrantedPermissions } from '../lib/permissions.js'

export const usersRouter = Router()
const roles = ['superadmin', 'admin', 'group', 'normal']

usersRouter.use(requireAdmin)

function sanitize(user: Record<string, unknown>) {
  const { password, refreshToken, ...safe } = user
  return { ...safe, permissions: (safe.permissions as string[]) ?? [] }
}

// 극단 담당자 계정은 관리할 극단을 반드시 지정해야 하고,
// 지정한 극단의 ID와 이름을 함께 저장해 이름이 바뀌어도 연결이 유지되도록 한다.
async function resolveTheaterGroupFields(role: string, theaterGroupId?: string) {
  if (role !== 'group') {
    return { ok: true as const, fields: { theaterGroup: null, permissions: [] as string[] } }
  }

  if (!theaterGroupId) {
    return { ok: false as const, message: '극단 담당자 계정은 담당 극단을 선택해야 합니다.' }
  }

  const group = await TheaterGroup.findById(theaterGroupId).select('name').lean<{ name: string }>()
  if (!group) {
    return { ok: false as const, message: '선택한 극단을 찾을 수 없습니다.' }
  }

  return {
    ok: true as const,
    fields: { theaterGroup: theaterGroupId, theaterGroupName: group.name },
  }
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
    const { name, email, phone, theaterGroupName, theaterGroup, permissions, password, role } = req.body
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

    const resolved = await resolveTheaterGroupFields(role || 'normal', theaterGroup)
    if (!resolved.ok) {
      fail(res, resolved.message, 400)
      return
    }

    const user = await User.create({
      name,
      email,
      phone,
      theaterGroupName: theaterGroupName || '없음',
      password: await bcrypt.hash(password, 12),
      role: role || 'normal',
      ...resolved.fields,
      permissions: role === 'group' ? normalizeGrantedPermissions(permissions) : [],
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

    const resolved = await resolveTheaterGroupFields(req.body.role, req.body.theaterGroup)
    if (!resolved.ok) {
      fail(res, resolved.message, 400)
      return
    }

    const update: Record<string, unknown> = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      theaterGroupName: req.body.theaterGroupName || '없음',
      role: req.body.role,
      ...resolved.fields,
      // 극단 계정이 아니게 되면 부여된 권한도 함께 비운다
      permissions: req.body.role === 'group' ? normalizeGrantedPermissions(req.body.permissions) : [],
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
