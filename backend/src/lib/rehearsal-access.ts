/**
 * 열린 단막극 연습일지를 누가 무엇까지 할 수 있는지 정한다.
 *
 * - 총괄 관리자(superadmin)·관리자(admin): 전부 (팀·일지 삭제는 이 두 등급만)
 * - 열린 단막극 담당 계정(group + programType short_play): 모든 팀 일지 보기·쓰기·고치기,
 *   연출 코멘트 쓰기, 팀 구성 만들기·고치기. 삭제는 못 한다
 * - 연습일지 작성 계정(rehearsal): 모든 팀 일지 보기, 자기 팀 일지만 쓰기·고치기.
 *   연출 코멘트와 삭제는 못 한다
 *
 * 권한을 토큰에 넣지 않고 매번 DB에서 읽는 이유는 ownership.ts와 같다
 * (관리자가 계정을 바꿔도 토큰이 만료될 때까지 옛 권한이 남지 않게).
 */
import type { Types } from 'mongoose'
import type { AuthPayload } from './auth.js'
import { User } from '../models/index.js'

export interface RehearsalAccess {
  /** 연습일지 화면에 들어올 수 있는지 */
  canView: boolean
  /** 팀 구성을 만들고 고칠 수 있는지 */
  canManageTeams: boolean
  /** 연출 코멘트를 쓸 수 있는지 */
  canComment: boolean
  /** 팀·일지를 지울 수 있는지 */
  canDelete: boolean
  /**
   * 일지를 쓰고 고칠 수 있는 팀. null이면 모든 팀.
   * 연습일지 작성 계정은 자기 팀 하나로 묶인다
   */
  writableTeamId: string | null
  /** 일지에 작성자로 남길 이름 */
  displayName: string
  /** 처음 받은 비밀번호를 아직 안 바꿔서 이름·비밀번호부터 정해야 하는지 */
  mustChangePassword: boolean
}

const NO_ACCESS: RehearsalAccess = {
  canView: false,
  canManageTeams: false,
  canComment: false,
  canDelete: false,
  writableTeamId: null,
  displayName: '',
  mustChangePassword: false,
}

export async function loadRehearsalAccess(authUser: AuthPayload): Promise<RehearsalAccess> {
  const user = await User.findById(authUser.userId)
    .select('name role theaterGroup programType rehearsalTeam mustChangePassword')
    .lean<{
      name: string
      role: string
      theaterGroup?: Types.ObjectId
      programType?: string
      rehearsalTeam?: Types.ObjectId
      mustChangePassword?: boolean
    }>()
  if (!user) return NO_ACCESS

  const base = { ...NO_ACCESS, displayName: user.name, mustChangePassword: !!user.mustChangePassword }

  if (user.role === 'superadmin' || user.role === 'admin') {
    return { ...base, canView: true, canManageTeams: true, canComment: true, canDelete: true }
  }

  if (user.role === 'group' && !user.theaterGroup && user.programType === 'short_play') {
    return { ...base, canView: true, canManageTeams: true, canComment: true }
  }

  // 팀이 지정되지 않은 작성 계정은 들어올 수 없게 한다 (어느 팀 일지를 쓸지 정할 수 없음)
  if (user.role === 'rehearsal' && user.rehearsalTeam) {
    return { ...base, canView: true, writableTeamId: String(user.rehearsalTeam) }
  }

  return NO_ACCESS
}

/** 이 팀의 일지를 쓰거나 고칠 수 있는지 */
export function canWriteTeam(access: RehearsalAccess, teamId: string): boolean {
  if (!access.canView) return false
  return access.writableTeamId === null || access.writableTeamId === teamId
}
