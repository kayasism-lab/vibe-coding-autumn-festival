/**
 * 기사 주소에서 제목·대표 이미지·발행일을 읽어온다.
 *
 * 언론사들은 카카오톡·페이스북 미리보기를 위해 오픈그래프(og:) 태그로
 * 이 정보를 공개해 둔다. 그 값만 읽어 쓰므로 기사 본문을 복제하지 않는다.
 * (본문과 사진은 언론사 저작물이라 옮겨 담으면 저작권 문제가 된다)
 */

/** 너무 큰 페이지를 통째로 받지 않도록 앞부분만 본다. 메타태그는 <head>에 있다 */
const MAX_BYTES = 512 * 1024
const TIMEOUT_MS = 10000

export type LinkPreview = {
  title: string
  description: string
  imageUrl: string
  /** 기사 발행일 (ISO). 사이트가 알려주지 않으면 빈 값 */
  publishedAt: string
  siteName: string
  url: string
}

/**
 * 바깥 주소만 허용한다.
 *
 * 서버가 시키는 대로 아무 주소나 열어주면, 바깥에서는 닿을 수 없는
 * 내부 주소(우리 DB나 클라우드 설정 서버 등)를 대신 열어보게 만들 수 있다.
 * 그래서 사설망·루프백 주소를 미리 막는다.
 */
function assertPublicUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('주소 형식이 올바르지 않습니다.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('http 또는 https 주소만 넣을 수 있습니다.')
  }

  const host = parsed.hostname.toLowerCase()
  const isBlocked =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)

  if (isBlocked) {
    throw new Error('내부 주소는 불러올 수 없습니다.')
  }

  return parsed
}

/** &amp; 같은 문자 표기를 원래 글자로 되돌린다 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // &amp;는 마지막에 풀어야 &amp;quot; 같은 이중 표기가 어긋나지 않는다
    .replace(/&amp;/g, '&')
}

/**
 * <meta> 태그를 모두 훑어 이름 → 값 표로 만든다.
 * 속성 순서가 사이트마다 달라서 태그 하나를 통째로 잡은 뒤 안에서 찾는다.
 */
function collectMetaTags(html: string): Map<string, string> {
  const result = new Map<string, string>()

  for (const match of html.matchAll(/<meta\s+([^>]*?)\/?>/gi)) {
    const attrs = match[1]
    const key = attrs.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]
    const value = attrs.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]
    if (!key || value === undefined) continue

    // 같은 이름이 여러 번 나오면 처음 것을 쓴다 (보통 <head> 위쪽이 대표값)
    const normalized = key.toLowerCase()
    if (!result.has(normalized)) result.set(normalized, decodeHtmlEntities(value.trim()))
  }

  return result
}

/** 사이트가 알려준 날짜 문자열을 ISO로. 읽을 수 없으면 빈 값 */
function toIsoDate(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const parsed = assertPublicUrl(rawUrl.trim())

  const response = await fetch(parsed.toString(), {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      // 미리보기용으로 읽는다는 것을 알리고, 사람이 보는 것과 같은 화면을 받는다
      'User-Agent': 'Mozilla/5.0 (compatible; AutumnFestivalBot/1.0; +link-preview)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`기사를 불러오지 못했습니다. (응답 코드 ${response.status})`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('html')) {
    throw new Error('기사 페이지가 아닌 것 같습니다.')
  }

  const html = (await response.text()).slice(0, MAX_BYTES)
  const meta = collectMetaTags(html)

  // og 값이 없는 사이트를 위해 일반 태그도 차례로 살펴본다
  const title =
    meta.get('og:title') ||
    meta.get('twitter:title') ||
    decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '')

  const description =
    meta.get('og:description') || meta.get('twitter:description') || meta.get('description') || ''

  const imageUrl = meta.get('og:image') || meta.get('twitter:image') || ''

  const publishedAt = toIsoDate(
    meta.get('article:published_time') ||
      meta.get('og:regdate') ||
      meta.get('date') ||
      meta.get('pubdate')
  )

  return {
    title,
    description,
    // 이미지 주소가 /path 형태로 오는 곳이 있어 절대 주소로 맞춰준다
    imageUrl: imageUrl ? new URL(imageUrl, parsed).toString() : '',
    publishedAt,
    siteName: meta.get('og:site_name') || parsed.hostname.replace(/^www\./, ''),
    url: meta.get('og:url') || parsed.toString(),
  }
}
