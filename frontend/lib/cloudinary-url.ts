/**
 * 화면에 맞는 크기로 이미지를 받아오도록 주소를 손본다.
 *
 * Cloudinary는 주소에 옵션을 끼워 넣으면 그 크기로 바꿔서 내려준다.
 * 원본은 그대로 두고 보는 사람에게만 작은 이미지를 보내므로,
 * 나중에 인쇄물처럼 원본이 필요할 때도 문제가 없다.
 *
 * 예) .../upload/v123/photo.jpg
 *   → .../upload/c_limit,w_800,q_auto,f_auto/v123/photo.jpg
 */

/** Cloudinary가 올려준 주소인지 (다른 곳 주소는 손대지 않는다) */
function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes('/upload/')
}

type Preset = {
  width: number
  /** 정해진 비율로 잘라낼지 (목록 칸처럼 크기가 고정된 자리에 쓴다) */
  crop?: { height: number }
}

/**
 * q_auto: 눈에 띄지 않을 만큼만 품질을 낮춘다
 * f_auto: 보는 브라우저가 지원하는 가벼운 형식(webp 등)으로 바꿔 보낸다
 */
function buildTransform({ width, crop }: Preset): string {
  return crop
    ? `c_fill,g_auto,w_${width},h_${crop.height},q_auto,f_auto`
    : `c_limit,w_${width},q_auto,f_auto`
}

function withTransform(url: string, preset: Preset): string {
  if (!url || !isCloudinaryUrl(url)) return url

  // 이미 옵션이 붙어 있으면 그대로 둔다 (두 번 겹치면 화질이 상한다)
  const [head, tail] = url.split('/upload/')
  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) return url

  return `${head}/upload/${buildTransform(preset)}/${tail}`
}

/** 목록 칸에 쓰는 크기. 4:3 자리에 맞춰 잘라 담는다 */
export function toThumbnailUrl(url: string): string {
  return withTransform(url, { width: 800, crop: { height: 600 } })
}

/** 작은 미리보기(크게 보기 아래 필름처럼 늘어놓는 줄) */
export function toMiniUrl(url: string): string {
  return withTransform(url, { width: 200, crop: { height: 200 } })
}

/** 크게 볼 때. 원래 비율을 지키면서 폭만 제한한다 */
export function toLargeUrl(url: string): string {
  return withTransform(url, { width: 1600 })
}
