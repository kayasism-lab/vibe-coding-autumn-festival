// 이용자가 직접 정하는 비밀번호의 규칙.
// 신청 내역·문의 조회에 쓰이는 비밀번호가 너무 짧으면, 전화번호를 아는 사람이
// 무차별 대입으로 남의 개인정보(이름·나이·성별·거주지 등)를 열람할 수 있어 기준을 둔다.
//
// 같은 규칙이 frontend/lib/password-policy.ts 에도 있다.
// 한쪽만 고치면 화면과 서버의 기준이 어긋나므로 반드시 함께 수정할 것.
//
// 화면에서만 막으면 요청을 직접 보내 우회할 수 있으므로 서버에서도 반드시 검증한다.

export const PASSWORD_MIN_LENGTH = 8

// 키보드로 입력 가능한 일반적인 특수문자
const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/

/** 규칙에 맞으면 null, 어긋나면 사용자에게 보여줄 오류 메시지를 돌려준다 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해주세요.`
  }
  if (!SPECIAL_CHAR_PATTERN.test(password)) {
    return '비밀번호에 특수문자(!, @, #, $ 등)를 1자 이상 포함해주세요.'
  }
  return null
}
