import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { TheaterGroup, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'
import { normalizeGrantedPermissions } from '../lib/permissions.js'
import { validatePassword } from '../lib/password-policy.js'
import { canDeleteAccount, canEditAccount, isHigherRole } from '../lib/account-authority.js'
import type { GroupAccountProgramType, UserRole } from '../types/index.js'

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

    // 관리자가 만드는 계정도 비밀번호 정책을 지켜야 한다 (약한 비밀번호로 뚫리는 것 방지)
    const passwordError = validatePassword(password)
    if (passwordError) {
      fail(res, passwordError, 400)
      return
    }

    // 총괄관리자(superadmin) 계정 생성은 총괄관리자만 할 수 있다 (일반 관리자의 셀프 승격 방지)
    if (role === 'superadmin' && res.locals.user.role !== 'superadmin') {
      fail(res, '총괄 관리자 계정은 총괄 관리자만 만들 수 있습니다.', 403)
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

    const target = await User.findById(req.params.id)
      .select('role')
      .lean<{ role: UserRole } | null>()
    if (!target) {
      fail(res, '사용자를 찾을 수 없습니다.', 404)
      return
    }

    const actor = res.locals.user
    const isSelf = actor.userId === req.params.id
    const isSuperAdmin = actor.role === 'superadmin'

    // 본인 계정이거나 자기보다 낮은 권한의 계정만 고칠 수 있다.
    // 동급 관리자끼리 서로의 계정을 바꿔 로그인을 가로채는 것을 막는다
    if (!canEditAccount(actor, { id: req.params.id, role: target.role })) {
      fail(res, '본인 계정이거나 하위 권한 계정만 수정할 수 있습니다.', 403)
      return
    }

    // 총괄관리자로 승격하는 것은 총괄관리자만 할 수 있다 (셀프 승격 방지)
    if (req.body.role === 'superadmin' && !isSuperAdmin) {
      fail(res, '총괄 관리자 권한은 총괄 관리자만 부여할 수 있습니다.', 403)
      return
    }

    // 본인 계정을 수정할 때 자기 권한을 바꾸는 것은 막는다.
    // 스스로 등급을 올리면 위 검사를 우회하게 되고, 내리면 관리자 화면에 못 들어간다
    if (isSelf && req.body.role && req.body.role !== target.role) {
      fail(res, '본인 계정의 권한은 바꿀 수 없습니다.', 403)
      return
    }

    // 낮은 권한 계정이라도 자기와 같거나 높은 등급으로 올려줄 수는 없다
    if (!isSelf && req.body.role && !isHigherRole(actor.role, req.body.role)) {
      fail(res, '자신과 같거나 높은 권한은 부여할 수 없습니다.', 403)
      return
    }

    // 비밀번호를 바꾸는 경우 정책을 검사하고, 요청자 본인임을 다시 확인한다.
    // 관리자 화면이 열려 있기만 하면 남의 계정을 가로챌 수 있어, 자리를 비운 사이의
    // 무단 변경을 막으려고 요청자의 현재 비밀번호를 함께 받는다
    if (req.body.password) {
      const passwordError = validatePassword(req.body.password)
      if (passwordError) {
        fail(res, passwordError, 400)
        return
      }

      if (!req.body.currentPassword) {
        fail(res, '현재 로그인한 계정의 비밀번호를 입력해주세요.', 400)
        return
      }

      const actorAccount = await User.findById(actor.userId)
        .select('password')
        .lean<{ password: string } | null>()
      if (!actorAccount || !(await bcrypt.compare(req.body.currentPassword, actorAccount.password))) {
        fail(res, '현재 비밀번호가 일치하지 않습니다.', 401)
        return
      }
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
      // 비밀번호를 바꾸면 기존 세션(리프레시 토큰)을 끊어 옛 비밀번호로 남은 세션을 무효화한다
      update.refreshToken = null
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
    // 자기 자신은 삭제할 수 없다 (실수로 자기 계정을 지워 잠기는 것 방지)
    if (req.params.id === res.locals.user.userId) {
      fail(res, '자기 자신은 삭제할 수 없습니다.', 400)
      return
    }

    const target = await User.findById(req.params.id)
      .select('role')
      .lean<{ role: UserRole } | null>()
    if (!target) {
      fail(res, '사용자를 찾을 수 없습니다.', 404)
      return
    }

    // 삭제는 되돌릴 수 없어 수정보다 좁게 잡는다. 자기보다 낮은 권한만 지울 수 있다
    if (!canDeleteAccount(res.locals.user, { id: req.params.id, role: target.role })) {
      fail(res, '하위 권한 계정만 삭제할 수 있습니다.', 403)
      return
    }
    // 마지막 총괄관리자를 지우면 아무도 총괄 권한을 못 갖게 되므로 막는다
    if (target.role === 'superadmin') {
      const superAdminCount = await User.countDocuments({ role: 'superadmin' })
      if (superAdminCount <= 1) {
        fail(res, '마지막 총괄 관리자 계정은 삭제할 수 없습니다.', 400)
        return
      }
    }

    await User.findByIdAndDelete(req.params.id)
    ok(res, null, '사용자가 삭제되었습니다.')
  })
)
