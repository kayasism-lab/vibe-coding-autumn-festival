/**
 * 홈 화면 홍보 영상의 주소를 만드는 곳.
 *
 * 영상은 Cloudinary에 올려두고 여기에는 public_id만 적어둔다.
 * **원본을 그대로 내려보내면 안 된다** — 원본은 1920×1080 / 20초 / 15.5MB이고,
 * 무료 플랜의 월 대역폭(25GB)이 1,600여 회 재생에 소진된다.
 * 변환을 거치면 아래처럼 줄어드는 것을 실측했다.
 *
 *   q_auto,vc_auto,w_1280 → 2.8MB (넓은 화면 자동재생용)
 *   q_auto,vc_auto,w_720  → 1.5MB (좁은 화면 눌러 재생용)
 *   so_0,q_auto,f_auto    →  68KB (재생 전 대표 이미지)
 *
 * 영상을 바꿀 때는 Cloudinary에 새로 올리고 PROMO_VIDEO_ID만 고치면 된다.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

/** 2026 가을연극축제 홍보 영상 (16:9 가로, 20초) */
export const PROMO_VIDEO_ID = 'autumn-theatre-final-v2_ffy0ql'

/** 영상 길이. 재생 전 안내 문구에 쓴다 */
export const PROMO_VIDEO_SECONDS = 20

/** 넓은 화면(자동재생)용 가로 크기. 1280이면 데스크톱에서도 또렷하다 */
export const PROMO_WIDTH_WIDE = 1280

/** 좁은 화면(눌러 재생)용 가로 크기. 휴대폰 가로폭의 배를 넘어 충분하다 */
export const PROMO_WIDTH_NARROW = 720

/** 좁은 화면에서 재생할 때 드는 데이터. 재생 버튼 옆에 미리 알려준다 */
export const PROMO_NARROW_SIZE_LABEL = '약 1.5MB'

/**
 * 환경변수(NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)가 없으면 null을 돌려준다.
 * 주소를 만들 수 없는 상태에서 깨진 영상 자리를 보여주는 것보다,
 * 섹션을 아예 그리지 않는 편이 낫다.
 */
function buildUrl(transform: string, extension: string): string | null {
  if (!CLOUD_NAME) return null
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transform}/${PROMO_VIDEO_ID}.${extension}`
}

/** 재생용 영상 주소. vc_auto는 보는 브라우저가 지원하는 코덱으로 바꿔 내려준다 */
export function getPromoVideoUrl(width: number): string | null {
  return buildUrl(`q_auto,vc_auto,w_${width}`, 'mp4')
}

/**
 * 재생 전에 먼저 보여주는 대표 이미지. 영상의 첫 장면(`so_0`)을 이미지로 받는다.
 * 처음 화면에 들어올 때는 이것만 받으므로 드는 데이터가 68KB로 끝난다.
 */
export function getPromoPosterUrl(width: number = PROMO_WIDTH_WIDE): string | null {
  return buildUrl(`so_0,q_auto,f_auto,w_${width}`, 'jpg')
}
