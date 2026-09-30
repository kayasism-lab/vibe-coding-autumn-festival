import { Router } from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { RehearsalTeam, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requireAuth } from '../middleware/require-admin.js'
import { validatePassword } from '../lib/password-policy.js'
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '../lib/auth.js'
import { cleanText } from '../lib/rehearsal-input.js'
import { teamKind } from '../lib/rehearsal-access.js'
import type { RehearsalKind } from '../types/index.js'

/**
 * 연습일지 팀원 계정 (열린 단막극 팀원, 열린 낭독극 수강생).
 *
 * 팀원이 많아 계정을 하나씩 만들기 번거로워, 팀마다 번호를 정해 한 번에 만든다.
 *   단막극 1번 팀 → jik_short_1001 ~ 1010, 2번 팀 → jik_short_2001 ~ ...
 *   낭독극 1번 팀 → jik_reading_1001 ~ (수강생용. 보고 댓글만 단다)
 * 낭독극 강사 계정은 여기서 만들지 않고 사용자 관리에서 '강사'로 표시해 하나씩 만든다.
 * 처음 비밀번호는 아이디와 같다. 아이디 규칙만 알면 누구나 들어올 수 있으므로
 * 첫 로그인 때 이름과 새 비밀번호를 정하기 전까지는 연습일지를 막는다(mustChangePassword).
 */
export const rehearsalAccountsRouter = Router()

// 종류별 아이디 앞머리. 프론트 lib/rehearsal.ts의 REHEARSAL_LABELS.idPrefix와 같은 값이어야 한다
const ID_PREFIX: Record<RehearsalKind, string> = { short_play: 'jik_short_', reading: 'jik_reading_' }
const KIND_LABEL: Record<RehearsalKind, string> = { short_play: '열린 단막극', reading: '열린 낭독극' }
const MAX_SERIES = 9
const MAX_COUNT = 99

function accountId(kind: RehearsalKind, series: number, seq: number) {
  return `${ID_PREFIX[kind]}${series * 1000 + seq}`
}

// 팀의 계정 목록 (관리자 전용)
rehearsalAccountsRouter.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const team = typeof req.query.team === 'string' ? req.query.team : ''
    if (!mongoose.isValidObjectId(team)) {
      fail(res, '팀을 선택해주세요.', 400)
      return
    }
    const users = await User.find({ role: 'rehearsal', rehearsalTeam: team })
      .select('email name mustChangePassword lastLoginAt rehearsalInstructor')
      .sort({ email: 1 })
      .lean()
    ok(res, users)
  })
)

// 팀 계정 한꺼번에 만들기 (관리자 전용). 이미 있는 아이디는 건너뛰므로 여러 번 눌러도 안전하다
rehearsalAccountsRouter.post(
  '/bulk',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { team: teamId } = req.body ?? {}
    const series = Number(req.body?.series)
    const count = Number(req.body?.count ?? 10)

    if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
      fail(res, '팀을 선택해주세요.', 400)
      return
    }
    if (!Number.isInteger(series) || series < 1 || series > MAX_SERIES) {
      fail(res, `팀 번호는 1~${MAX_SERIES} 사이로 정해주세요.`, 400)
      return
    }
    if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
      fail(res, `계정 수는 1~${MAX_COUNT}개 사이로 정해주세요.`, 400)
      return
    }

    const team = await RehearsalTeam.findById(teamId).lean<{ _id: unknown; name: string; kind?: string } | null>()
    if (!team) {
      fail(res, '팀을 찾을 수 없습니다.', 404)
      return
    }
    const kind = teamKind(team)
    // 한 번호를 두 팀이 나눠 쓰면 어느 팀 계정인지 헷갈리므로 막는다.
    // 아이디 앞머리가 종류마다 달라, 단막극 1번과 낭독극 1번은 함께 쓸 수 있다
    // teamId는 위에서 ObjectId 형식을 확인했다. 전역 sanitizeFilter 때문에 $ne는 trusted로 감싼다
    const seriesTeams = await RehearsalTeam.find({ accountSeries: series, _id: mongoose.trusted({ $ne: teamId }) })
      .select('name kind')
      .lean<{ name: string; kind?: string }[]>()
    const sameSeries = seriesTeams.find((item) => teamKind(item) === kind)
    if (sameSeries) {
      fail(res, `${series}번은 이미 '${sameSeries.name}' 팀이 쓰고 있습니다.`, 409)
      return
    }
    await RehearsalTeam.updateOne({ _id: teamId }, { accountSeries: series })

    const created: string[] = []
    const skipped: string[] = []
    for (let seq = 1; seq <= count; seq++) {
      const email = accountId(kind, series, seq)
      if (await User.exists({ email })) {
        skipped.push(email)
        continue
      }
      await User.create({
        // 이름은 팀원이 첫 로그인 때 직접 넣는다. 그 전까지는 아이디를 이름 자리에 둔다
        name: email,
        email,
        password: await bcrypt.hash(email, 12),
        role: 'rehearsal',
        rehearsalTeam: teamId,
        // 낭독극은 팀명이 곧 '열린 낭독극'이라 되풀이하지 않는다
        theaterGroupName: kind === 'reading' ? KIND_LABEL[kind] : `${KIND_LABEL[kind]} · ${team.name}`,
        mustChangePassword: true,
      })
      created.push(email)
    }

    ok(res, { created, skipped }, `계정 ${created.length}개를 만들었습니다.`, 201)
  })
)

// 비밀번호를 잊은 팀원: 아이디와 같은 값으로 되돌리고 첫 로그인 설정을 다시 하게 한다 (관리자 전용)
rehearsalAccountsRouter.post(
  '/:id/reset',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      fail(res, '계정을 찾을 수 없습니다.', 404)
      return
    }
    const user = await User.findOne({ _id: req.params.id, role: 'rehearsal' }).select('email')
    if (!user) {
      fail(res, '연습일지 계정만 초기화할 수 있습니다.', 404)
      return
    }
    await User.updateOne(
      { _id: user._id },
      // 기존 로그인도 모두 끊는다 (옛 비밀번호로 남은 세션 무효화)
      { password: await bcrypt.hash(user.email, 12), mustChangePassword: true, refreshToken: null }
    )
    ok(res, null, '비밀번호를 아이디와 같게 되돌렸습니다. 다음 로그인 때 새로 정하게 됩니다.')
  })
)

// 팀원 본인: 이름 고치기 + 비밀번호 바꾸기 (첫 로그인 때는 둘 다 필수)
rehearsalAccountsRouter.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(res.locals.user.userId)
    if (!user || user.role !== 'rehearsal') {
      fail(res, '연습일지 계정만 사용할 수 있습니다.', 403)
      return
    }

    const name = cleanText(req.body?.name, 20)
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''

    // 아이디를 그대로 이름으로 두는 것을 막는다 (일지 작성자 칸에 아이디가 찍힌다)
    if (!name || name === user.email) {
      fail(res, '이름을 입력해주세요.', 400)
      return
    }
    if (user.mustChangePassword && !newPassword) {
      fail(res, '처음 로그인하셨으니 새 비밀번호를 정해주세요.', 400)
      return
    }

    const update: Record<string, unknown> = { name }
    let passwordChanged = false
    if (newPassword) {
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        fail(res, '지금 비밀번호가 맞지 않습니다.', 401)
        return
      }
      const policyError = validatePassword(newPassword)
      if (policyError) {
        fail(res, policyError, 400)
        return
      }
      if (newPassword === user.email) {
        fail(res, '아이디와 다른 비밀번호를 정해주세요.', 400)
        return
      }
      update.password = await bcrypt.hash(newPassword, 12)
      update.mustChangePassword = false
      passwordChanged = true
    }

    if (passwordChanged) {
      // 비밀번호를 바꾸면 다른 기기의 로그인은 끊고, 지금 기기만 새 토큰으로 이어준다
      const payload = { userId: String(user._id), email: user.email, role: user.role }
      const accessToken = await generateAccessToken(payload)
      const refreshToken = await generateRefreshToken(payload)
      update.refreshToken = refreshToken
      await User.updateOne({ _id: user._id }, update)
      setAuthCookies(res, accessToken, refreshToken, user.role)
    } else {
      await User.updateOne({ _id: user._id }, update)
    }

    ok(res, { name }, passwordChanged ? '이름과 비밀번호를 저장했습니다.' : '이름을 저장했습니다.')
  })
)
