/**
 * 시민참여(열린 낭독극·열린 단막극) 신청 접수 상태.
 *
 * 백엔드 `backend/src/lib/citizen-application-status.ts`와 같은 규칙을 쓴다.
 * 한쪽만 고치면 화면과 서버가 서로 다른 말을 하게 되므로 함께 고칠 것.
 */
export type CitizenApplicationStatus = 'open' | 'closed' | 'preparing' | 'ended'

/** 신청을 받지 않는 상태(= 안내 팝업을 띄우는 상태) */
export type CitizenApplicationBlockedStatus = Exclude<CitizenApplicationStatus, 'open'>

/** 관리자가 상태별로 입력한 안내 문구. 비어 있으면 기본 문구를 쓴다 */
export type CitizenApplicationMessages = Partial<Record<CitizenApplicationBlockedStatus, string>>

/** 시민이 직접 신청하는 공연 유형. 연극(play)은 극단이 참가 신청을 하므로 여기 없다 */
export type CitizenProgramType = 'reading' | 'short_play'

export const citizenProgramLabels: Record<CitizenProgramType, string> = {
  reading: '열린 낭독극',
  short_play: '열린 단막극',
}

export const citizenApplicationStatusLabels: Record<CitizenApplicationStatus, string> = {
  open: '신청가능',
  closed: '신청마감',
  preparing: '신청준비중',
  ended: '행사종료',
}

/** 관리 화면 선택 상자에 쓰는 상태 목록 */
export const citizenApplicationStatusOptions: {
  value: CitizenApplicationStatus
  label: string
  hint: string
}[] = [
  { value: 'open', label: '신청가능', hint: '신청 폼을 그대로 보여줍니다.' },
  { value: 'closed', label: '신청마감', hint: '안내 팝업을 띄우고 메인화면으로 보냅니다.' },
  { value: 'preparing', label: '신청준비중', hint: '안내 팝업을 띄우고 메인화면으로 보냅니다.' },
  { value: 'ended', label: '행사종료', hint: '안내 팝업을 띄우고 메인화면으로 보냅니다.' },
]

/** 관리자가 문구를 비워뒀을 때 쓰는 기본 안내 문구. 백엔드 기본값과 같은 문장이다 */
export const citizenApplicationDefaultMessages: Record<CitizenApplicationBlockedStatus, string> = {
  closed: '신청이 마감되었습니다. 많은 관심 가져주셔서 감사합니다.',
  preparing: '아직 신청 기간이 아닙니다. 곧 신청 페이지를 오픈할 예정입니다.',
  ended: '행사가 종료되었습니다. 함께해 주셔서 감사합니다.',
}

interface ProgramLike {
  applicationStatus?: string | null
  openForApplication?: boolean | null
  applicationMessages?: CitizenApplicationMessages | null
}

/**
 * 프로그램 값에서 실제 접수 상태를 읽는다.
 *
 * `applicationStatus`가 생기기 전에 저장된 작품에는 이 값이 없어서,
 * 그때는 예전 기준(`openForApplication`)으로 대신 판단한다.
 */
export function resolveCitizenApplicationStatus(program?: ProgramLike | null): CitizenApplicationStatus {
  // 해당 유형의 작품 자체가 아직 등록되지 않았다면 준비 중으로 본다
  if (!program) return 'preparing'

  const status = program.applicationStatus
  if (status === 'open' || status === 'closed' || status === 'preparing' || status === 'ended') {
    return status
  }
  return program.openForApplication ? 'open' : 'closed'
}

/** 팝업에 띄울 안내 문구를 고른다. 관리자가 입력한 문구가 있으면 그것을 쓴다 */
export function resolveCitizenApplicationMessage(
  program: ProgramLike | null | undefined,
  status: CitizenApplicationBlockedStatus
): string {
  const custom = program?.applicationMessages?.[status]?.trim()
  return custom || citizenApplicationDefaultMessages[status]
}
