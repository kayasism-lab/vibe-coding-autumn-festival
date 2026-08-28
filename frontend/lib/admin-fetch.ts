/**
 * 관리 화면에서 쓰는 fetch.
 *
 * 로그인은 15분짜리 토큰으로 유지된다. 사진을 여러 장 올리는 것처럼 시간이 걸리는
 * 일을 하면 저장을 누르는 시점에 이미 만료돼 있을 수 있는데, 그때 그냥 실패시키면
 * 애써 올린 것이 사라진다. 그래서 한 번은 세션을 이어보고 같은 요청을 다시 보낸다.
 */

/** 세션 연장 요청. 성공하면 새 액세스 토큰 쿠키가 내려온다 */
export async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 401을 받으면 세션을 한 번 이어본 뒤 같은 요청을 다시 보낸다.
 * 그래도 401이면 정말 다시 로그인해야 하는 상황이라 그대로 돌려준다.
 */
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status !== 401) return res

  if (!(await refreshSession())) return res
  return fetch(input, init)
}

/** 응답에서 사용자에게 보여줄 실패 사유를 뽑는다 */
export async function getErrorMessage(res: Response): Promise<string> {
  if (res.status === 401) {
    return '로그인이 풀렸습니다. 새로고침 후 다시 로그인해주세요.'
  }

  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return body.error
  } catch {
    // 본문이 JSON이 아닌 경우 아래 기본 문구를 쓴다
  }
  return `저장하지 못했습니다. (오류 ${res.status})`
}
