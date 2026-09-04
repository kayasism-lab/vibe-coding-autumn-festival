/**
 * 시민참여(열린 낭독극·열린 단막극) 신청 접수 상태.
 *
 * 예전에는 프로그램의 `openForApplication`(켬/끔) 하나로만 판단했는데,
 * "아직 신청 기간이 아님" · "접수를 마감함" · "행사 자체가 끝남"이
 * 화면에서 전부 똑같이 보였다. 안내 문구가 각각 달라야 해서 네 가지로 나눴다.
 */
export type CitizenApplicationStatus = 'open' | 'closed' | 'preparing' | 'ended'

/** 관리 화면 선택 상자와 모델 enum에서 함께 쓰는 값 목록 */
export const CITIZEN_APPLICATION_STATUSES: CitizenApplicationStatus[] = [
  'open',
  'closed',
  'preparing',
  'ended',
]

/** 관리자가 직접 문구를 채울 수 있는 상태(= 신청을 받지 않는 상태) */
export type CitizenApplicationBlockedStatus = Exclude<CitizenApplicationStatus, 'open'>

/** 프로그램 문서에 저장되는 상태별 안내 문구. 비어 있으면 기본 문구를 쓴다 */
export type CitizenApplicationMessages = Partial<Record<CitizenApplicationBlockedStatus, string>>

interface ProgramLike {
  applicationStatus?: string | null
  openForApplication?: boolean | null
  applicationMessages?: CitizenApplicationMessages | null
}

/**
 * 프로그램 문서에서 실제 접수 상태를 읽는다.
 *
 * `applicationStatus`가 생기기 전에 저장된 문서에는 이 값이 없으므로,
 * 그때는 예전 기준(`openForApplication`)으로 대신 판단한다.
 * 이 대체 처리가 없으면 기존 낭독극·단막극이 갑자기 다른 상태로 바뀌어 보인다.
 */
export function resolveCitizenApplicationStatus(program: ProgramLike): CitizenApplicationStatus {
  const status = program.applicationStatus
  if (CITIZEN_APPLICATION_STATUSES.includes(status as CitizenApplicationStatus)) {
    return status as CitizenApplicationStatus
  }
  return program.openForApplication ? 'open' : 'closed'
}

/** 관리자가 문구를 비워뒀을 때 쓰는 기본 안내 문구 */
export const CITIZEN_APPLICATION_DEFAULT_MESSAGES: Record<CitizenApplicationBlockedStatus, string> = {
  closed: '신청이 마감되었습니다. 많은 관심 가져주셔서 감사합니다.',
  preparing: '아직 신청 기간이 아닙니다. 곧 신청 페이지를 오픈할 예정입니다.',
  ended: '행사가 종료되었습니다. 함께해 주셔서 감사합니다.',
}

/**
 * 신청자에게 보여줄 안내 문구를 고른다.
 *
 * 관리자가 입력한 문구가 있으면 그것을, 비워뒀으면 기본 문구를 쓴다.
 * 화면과 서버 응답이 같은 문장을 쓰도록 양쪽에서 이 함수를 거친다.
 */
export function resolveCitizenApplicationMessage(
  program: ProgramLike,
  status: CitizenApplicationBlockedStatus
): string {
  const custom = program.applicationMessages?.[status]?.trim()
  return custom || CITIZEN_APPLICATION_DEFAULT_MESSAGES[status]
}

/**
 * 저장 직전에 예전 필드(openForApplication)를 새 상태에 맞춰 맞춰준다.
 *
 * 두 값이 어긋나면 목록 화면과 신청 화면이 서로 다른 말을 하게 되므로,
 * 새 상태를 보낸 요청에 한해 서버가 강제로 일치시킨다.
 */
export function syncOpenForApplication(payload: Record<string, unknown>): void {
  const status = payload.applicationStatus
  if (CITIZEN_APPLICATION_STATUSES.includes(status as CitizenApplicationStatus)) {
    payload.openForApplication = status === 'open'
  }
}
