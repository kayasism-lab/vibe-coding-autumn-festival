/**
 * 공지·보도 게시판 분류.
 *
 * 종류가 넷(공지·이벤트·보도자료·미디어)인데 이를 두 게시판으로 나눠 쓴다.
 * 예전에는 홈 화면 한쪽이 '전체'를 보여줘서 옆에 있는 보도·미디어와 같은 글이
 * 두 번 나왔다. 어떤 게시판이 어떤 종류를 담는지 여기 한 곳에서 정한다.
 */

export type NoticeCategory = 'notice' | 'press' | 'event' | 'media'

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  notice: '공지',
  event: '이벤트',
  press: '보도자료',
  media: '미디어',
}

/** 공지사항 게시판이 담는 종류 */
export const NOTICE_BOARD_CATEGORIES: NoticeCategory[] = ['notice', 'event']

/** 보도·미디어 게시판이 담는 종류 */
export const PRESS_BOARD_CATEGORIES: NoticeCategory[] = ['press', 'media']

/** API에 넘길 category 값 ('notice,event') */
export function toCategoryParam(categories: NoticeCategory[]): string {
  return categories.join(',')
}

export function getNoticeCategoryLabel(category?: NoticeCategory): string {
  return category ? NOTICE_CATEGORY_LABELS[category] ?? '공지' : '공지'
}

/**
 * 화면에 보여줄 날짜.
 * 예전 보도를 뒤늦게 올린 경우 등록 시각이 아니라 그 시절 날짜를 써야 한다.
 */
export function getNoticeDate(notice: { publishedAt?: string; createdAt: string }): Date {
  return new Date(notice.publishedAt ?? notice.createdAt)
}

/** 2026. 8. 28. 형식 (한국 시각 기준) */
export function formatNoticeDate(notice: { publishedAt?: string; createdAt: string }): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(getNoticeDate(notice))
}

/**
 * 본문이 HTML로 작성됐는지.
 *
 * 꾸민 공지는 HTML로 붙여넣을 수 있다. 저장할 때 서버가 위험한 태그를 걸러내므로
 * 화면에서는 그대로 그려도 된다. 평범한 글은 줄바꿈만 살려 보여준다.
 */
export function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content)
}

/** 한국 시각 기준 올해. 해가 바뀌면 저절로 따라가도록 계산해서 쓴다 */
export function getCurrentKstYear(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(new Date())
  )
}

/** 연도 선택에 쓸 값 (한국 시각 기준) */
export function getNoticeYear(notice: { publishedAt?: string; createdAt: string }): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(getNoticeDate(notice))
}
