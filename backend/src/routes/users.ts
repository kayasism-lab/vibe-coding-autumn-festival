import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { TheaterGroup, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'
import { normalizeGrantedPermissions } from '../lib/permissions.js'
import type { GroupAccountProgramType } from '../types/index.js'

export const usersRouter = Router()
const roles = ['superadmin', 'admin', 'group', 'normal']

// 담당 극단 없이(협의회 직접 주관) 공연 유형만 담당하는 계정의 표시용 이름.
// theaterGroupName 자리에 그대로 저장해, 화면에서 담당 극단과 같은 방식으로 보여준다.
const PROGRAM_TYPE_ACCOUNT_LABELS: Record<GroupAccountProgramType, string> = {
  reading: '열린 낭독극',
  short_play: '열린 단막극',
}

usersRouter.use(requireAdmin)

function sanitize(user: Record<string, unknown>) {
  const { password, refreshToken, ...safe } = user
  return { ...safe, permissions: (safe.permissions as string[]) ?? [] }
}

// 극단 담당자 계정은 담당 극단 또는 담당 공연 유형(낭독극·단막극) 중 하나를 반드시 지정해야 한다.
// 극단을 지정하면 ID와 이름을 함께 저장해 이름이 바뀌어도 연결이 유지되도록 하고,
// 공연 유형을 지정하면 표시용 이름만 정해진 라벨로 채운다(연결할 극단 실체가 없음).
async function resolveGroupOwnerFields(
  role: string,
  theaterGroupId?: string,
  programType?: string
) {
  if (role !== 'group') {
    return {
      ok: true as const,
      fields: { theaterGroup: null, programType: null, permissions: [] as string[] },
    }
  }

  if (theaterGroupId) {
    const group = await TheaterGroup.findById(theaterGroupId).select('name').lean<{ name: string }>()
    if (!group) {
      return { ok: false as const, message: '선택한 극단을 찾을 수 없습니다.' }
    }

    return {
      ok: true as const,
      fields: { theaterGroup: theaterGroupId, theaterGroupName: group.name, programType: null },
    }
  }

  if (programType === 'reading' || programType === 'short_play') {
    return {
      ok: true as const,
      fields: {
        theaterGroup: null,
        programType,
        theaterGroupName: PROGRAM_TYPE_ACCOUNT_LABELS[programType],
      },
    }
  }

  return {
    ok: false as const,
    message: '극단 담당자 계정은 담당 극단이나 담당 공연 유형을 선택해야 합니다.',
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
    const { name, email, phone, theaterGroupName, theaterGroup, programType, permissions, password, role } =
      req.body
    // email 필드는 실제로 로그인 아이디로만 쓰인다 (연락처는 선택 항목)
    if (!name || !email || !password) {
      fail(res, '이름, 아이디, 비밀번호를 입력해주세요.', 400)
      return
    }
    if (role && !roles.includes(role)) {
      fail(res, '올바르지 않은 사용자 타입입니다.', 400)
      return
    }

    const exists = await User.findOne({ email })
    if (exists) {
      fail(res, '이미 사용 중인 아이디입니다.', 409)
      return
    }

    const resolved = await resolveGroupOwnerFields(role || 'normal', theaterGroup, programType)
    if (!resolved.ok) {
      fail(res, resolved.message, 400)
      return
    }

    const user = await User.create({
      name,
      email,
      phone: phone || '',
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

    // 수정 시에도 로그인에 필요한 이름·아이디는 비울 수 없다 (비밀번호는 비우면 기존 값 유지)
    if (!req.body.name || !req.body.email) {
      fail(res, '이름과 아이디를 입력해주세요.', 400)
      return
    }

    const resolved = await resolveGroupOwnerFields(req.body.role, req.body.theaterGroup, req.body.programType)
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
