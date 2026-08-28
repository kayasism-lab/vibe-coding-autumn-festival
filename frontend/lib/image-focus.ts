/**
 * 이미지 초점(focal point) 계산.
 *
 * 가로로 긴 자리에 세로 포스터를 넣으면 `object-cover`가 가운데만 남기고 위아래를 잘라낸다.
 * 잘려나갈 위치를 관리자가 정할 수 있도록 "이미지의 어느 지점을 중심에 둘지"를
 * 0~100(%) 좌표로 저장하고, 화면에서는 그 값을 그대로 `object-position`으로 쓴다.
 */

export type ImageFocus = { x: number; y: number }

/** 값이 없을 때의 기본값. 지금까지의 동작(가운데 정렬)과 같다 */
export const CENTER_FOCUS: ImageFocus = { x: 50, y: 50 }

/**
 * 홈 화면 "참여 극단 & 공연" 카드의 이미지 영역 비율.
 * 3열 그리드(max-w-7xl · gap-6) 기준 카드 폭 약 389px, 높이는 h-32(128px).
 * 관리 화면 미리보기를 실제 카드와 같은 모양으로 맞추기 위해 상수로 둔다.
 */
export const HOME_CARD_RATIO = 389 / 128

export function clampFocus(focus: ImageFocus): ImageFocus {
  const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)))
  return { x: clamp(focus.x), y: clamp(focus.y) }
}

/** CSS object-position 값으로 바꾼다. 값이 없으면 가운데 */
export function toObjectPosition(focus?: ImageFocus | null): string {
  const { x, y } = focus ?? CENTER_FOCUS
  return `${x}% ${y}%`
}

/**
 * object-cover로 그렸을 때 프레임 밖으로 넘쳐 잘리는 픽셀 양.
 *
 * 넘치는 쪽만 드래그로 움직일 수 있다. 예를 들어 세로로 긴 포스터를 가로로 긴
 * 카드에 넣으면 위아래(y)만 잘리므로 좌우(x)는 아무리 끌어도 변화가 없다.
 */
export function getCoverOverflow(
  natural: { width: number; height: number },
  frame: { width: number; height: number }
): { x: number; y: number } {
  if (!natural.width || !natural.height || !frame.width || !frame.height) {
    return { x: 0, y: 0 }
  }

  // object-cover는 프레임을 가득 채우는 쪽 배율을 택한다
  const scale = Math.max(frame.width / natural.width, frame.height / natural.height)
  return {
    x: Math.max(0, natural.width * scale - frame.width),
    y: Math.max(0, natural.height * scale - frame.height),
  }
}
