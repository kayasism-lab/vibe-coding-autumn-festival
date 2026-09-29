/**
 * 연습일지 요청 값 정리.
 * 화면에서 보낸 값을 그대로 저장하지 않고 형식과 길이를 맞춘 뒤 쓴다.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** 문자열이면 앞뒤 공백을 지우고 길이를 자른다. 문자열이 아니면 빈 문자열 */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

/** 이름 목록 정리: 빈 칸·중복을 빼고 순서는 유지한다 */
export function cleanNames(value: unknown, maxCount = 50): string[] {
  if (!Array.isArray(value)) return []
  const names = value.map((item) => cleanText(item, 40)).filter(Boolean)
  return [...new Set(names)].slice(0, maxCount)
}

/** 'YYYY-MM-DD'가 아니면 null */
export function cleanDate(value: unknown): string | null {
  return typeof value === 'string' && DATE_PATTERN.test(value) ? value : null
}

/** 'HH:mm'이 아니면 빈 문자열 (시간은 비워 둘 수 있다) */
export function cleanTime(value: unknown): string {
  return typeof value === 'string' && TIME_PATTERN.test(value) ? value : ''
}

/**
 * 사진 주소 목록. 업로드 화면이 Cloudinary에 올린 뒤 받은 https 주소만 받는다.
 * 다른 값이 섞이면 일지 화면에 엉뚱한 외부 주소가 걸릴 수 있어 걸러낸다
 */
export function cleanPhotoUrls(value: unknown, maxCount = 20): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .filter((url) => url.startsWith('https://res.cloudinary.com/'))
    .slice(0, maxCount)
}
