/**
 * 연습일지(열린 단막극·열린 낭독극)를 누가 무엇까지 할 수 있는지 정한다.
 *
 * - 총괄 관리자(superadmin)·관리자(admin): 두 종류 전부 (팀·일지 삭제는 이 두 등급만)
 * - 담당 계정(group + programType short_play / reading): 자기 종류의 모든 팀 일지 보기·쓰기·고치기,
 *   연출(강사) 코멘트 쓰기, 팀 구성 만들기·고치기. 삭제는 못 한다
 * - 단막극 팀 계정(rehearsal): 단막극 모든 팀 일지 보기, 자기 팀 일지만 쓰기·고치기.
 *   연출 코멘트와 삭제는 못 한다
 * - 낭독극 강사 계정(rehearsal + rehearsalInstructor): 낭독극 일지 보기, 자기 팀 일지 쓰기·고치기,
 *   강사 코멘트 쓰기
 * - 낭독극 수강생 계정(rehearsal): 낭독극 일지 보기와 댓글만. 일지는 쓰지 못한다
 *
 * 단막극과 낭독극은 서로의 팀·일지를 보지 못한다(사용자 결정, 2026-09-30).
 *
 * 권한을 토큰에 넣지 않고 매번 DB에서 읽는 이유는 ownership.ts와 같다
 * (관리자가 계정을 바꿔도 토큰이 만료될 때까지 옛 권한이 남지 않게).
 */
import mongoose, { type Types } from 'mongoose'
import type { AuthPayload } from './auth.js'
import { RehearsalTeam, User } from '../models/index.js'
import type { RehearsalKind } from '../types/index.js'

export interface RehearsalAccess {
  /** 연습일지 화면에 들어올 수 있는지 */
  canView: boolean
  /** 볼 수 있는 종류. null이면 단막극·낭독극 모두 (관리자) */
  kind: RehearsalKind | null
  /** 팀 구성을 만들고 고칠 수 있는지 */
  canManageTeams: boolean
  /** 연출 코멘트(낭독극은 강사 코멘트)를 쓸 수 있는지 */
  canComment: boolean
  /** 팀·일지를 지울 수 있는지 */
  canDelete: boolean
  /**
   * 일지를 쓰고 고칠 수 있는 팀. null이면 볼 수 있는 모든 팀, 빈 문자열이면 어느 팀에도 못 쓴다.
   * 단막극 팀 계정과 낭독극 강사 계정은 자기 팀 하나로 묶인다
   */
  writableTeamId: string | null
  /** 일지에 작성자로 남길 이름 */
  displayName: string
  /** 처음 받은 비밀번호를 아직 안 바꿔서 이름·비밀번호부터 정해야 하는지 */
  mustChangePassword: boolean
}

const NO_ACCESS: RehearsalAccess = {
  canView: false,
  kind: null,
  canManageTeams: false,
  canComment: false,
  canDelete: false,
  writableTeamId: '',
  displayName: '',
  mustChangePassword: false,
}

/** 팀의 종류. 낭독극을 더하기 전에 만든 팀에는 값이 없어 단막극으로 본다 */
export function teamKind(team: { kind?: string | null }): RehearsalKind {
  return team.kind === 'reading' ? 'reading' : 'short_play'
}

export async function loadRehearsalAccess(authUser: AuthPayload): Promise<RehearsalAccess> {
  const user = await User.findById(authUser.userId)
    .select('name role theaterGroup programType rehearsalTeam rehearsalInstructor mustChangePassword')
    .lean<{
      name: string
      role: string
      theaterGroup?: Types.ObjectId
      programType?: string
      rehearsalTeam?: Types.ObjectId
      rehearsalInstructor?: boolean
      mustChangePassword?: boolean
    }>()
  if (!user) return NO_ACCESS

  const base = { ...NO_ACCESS, displayName: user.name, mustChangePassword: !!user.mustChangePassword }

  if (user.role === 'superadmin' || user.role === 'admin') {
    return { ...base, canView: true, canManageTeams: true, canComment: true, canDelete: true, writableTeamId: null }
  }

  // 담당 계정: 담당 공연 유형이 곧 볼 수 있는 연습일지 종류다
  if (user.role === 'group' && !user.theaterGroup && (user.programType === 'short_play' || user.programType === 'reading')) {
    return { ...base, canView: true, kind: user.programType, canManageTeams: true, canComment: true, writableTeamId: null }
  }

  // 팀이 지정되지 않은 계정은 들어올 수 없게 한다 (어느 종류·어느 팀인지 정할 수 없음)
  if (user.role === 'rehearsal' && user.rehearsalTeam) {
    const team = await RehearsalTeam.findById(user.rehearsalTeam).select('kind').lean<{ kind?: string } | null>()
    if (!team) return NO_ACCESS
    const teamId = String(user.rehearsalTeam)

    if (teamKind(team) === 'reading') {
      // 낭독극은 강사만 쓰고 강사 코멘트를 남긴다. 수강생은 보기·댓글만
      const isInstructor = !!user.rehearsalInstructor
      return {
        ...base,
        canView: true,
        kind: 'reading',
        canComment: isInstructor,
        writableTeamId: isInstructor ? teamId : '',
      }
    }
    return { ...base, canView: true, kind: 'short_play', writableTeamId: teamId }
  }

  return NO_ACCESS
}

/** 이 종류의 팀·일지를 볼 수 있는지 */
export function canSeeKind(access: RehearsalAccess, kind: RehearsalKind): boolean {
  return access.canView && (access.kind === null || access.kind === kind)
}

/** 이 팀의 일지를 쓰거나 고칠 수 있는지 (볼 수 있는 팀인지는 findVisibleTeam으로 따로 확인한다) */
export function canWriteTeam(access: RehearsalAccess, teamId: string): boolean {
  if (!access.canView) return false
  return access.writableTeamId === null || access.writableTeamId === teamId
}

export type VisibleTeam = {
  _id: Types.ObjectId
  kind?: string
  name: string
  members: string[]
}

/** 볼 수 있는 팀이면 팀 정보를, 없거나 다른 종류의 팀이면 null을 돌려준다 */
export async function findVisibleTeam(access: RehearsalAccess, teamId: unknown): Promise<VisibleTeam | null> {
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) return null
  const team = await RehearsalTeam.findById(teamId).select('kind name members').lean<VisibleTeam | null>()
  if (!team || !canSeeKind(access, teamKind(team))) return null
  return team
}

/**
 * 볼 수 있는 팀의 id 목록. 전부 볼 수 있으면(관리자) null.
 * kind 값이 없는 예전 팀이 있어 DB 조건이 아니라 읽은 뒤에 가른다 (팀은 몇 개뿐이다)
 */
export async function visibleTeamIds(access: RehearsalAccess): Promise<string[] | null> {
  if (access.kind === null) return null
  const teams = await RehearsalTeam.find().select('kind').lean<{ _id: Types.ObjectId; kind?: string }[]>()
  return teams.filter((team) => canSeeKind(access, teamKind(team))).map((team) => String(team._id))
}
