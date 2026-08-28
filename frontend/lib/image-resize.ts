/**
 * 올리기 전에 사진 크기를 줄인다.
 *
 * 요즘 휴대폰 사진은 한 장에 5~12MB라 여러 장 올리면 몇 분씩 걸리고,
 * 보는 사람도 그 용량을 그대로 내려받게 된다.
 * 화면으로 보기에는 긴 변 2000px이면 충분해서, 그보다 크면 줄여서 올린다.
 */

/** 긴 변 기준 최대 크기. 고화질 모니터에서 크게 봐도 충분한 값 */
const MAX_EDGE = 2000

/** JPEG 품질. 0.85는 눈으로 차이를 느끼기 어려우면서 용량은 크게 줄어드는 지점 */
const QUALITY = 0.85

/** 이 크기 아래면 굳이 손대지 않는다 (이미 가벼운 사진) */
const SKIP_UNDER_BYTES = 400 * 1024

export type ResizeResult = {
  file: File
  /** 실제로 줄였는지 (안 줄였으면 원본 그대로) */
  resized: boolean
  originalSize: number
}

/** 브라우저에서 이미지를 읽어 캔버스에 다시 그린다 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 읽지 못했습니다.'))
    }
    image.src = url
  })
}

/**
 * 사진을 적당한 크기로 줄인다.
 * 줄일 수 없는 형식이거나 실패하면 원본을 그대로 돌려준다 - 업로드 자체가 막히면 안 되므로.
 */
export async function resizeImageFile(file: File): Promise<ResizeResult> {
  const original = { file, resized: false, originalSize: file.size }

  // GIF는 움직임이 사라지고, SVG는 그림 방식이 달라 캔버스로 다루면 망가진다
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return original
  if (file.size < SKIP_UNDER_BYTES) return original

  try {
    const image = await loadImage(file)
    const longestEdge = Math.max(image.width, image.height)

    // 이미 충분히 작으면 그대로 둔다
    if (longestEdge <= MAX_EDGE) return original

    const scale = MAX_EDGE / longestEdge
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)

    const context = canvas.getContext('2d')
    if (!context) return original

    // 줄일 때 계단현상이 덜하도록 부드럽게 그린다
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    )
    if (!blob || blob.size >= file.size) return original

    // 확장자도 실제 형식에 맞춰 바꿔준다
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return {
      file: new File([blob], name, { type: 'image/jpeg' }),
      resized: true,
      originalSize: file.size,
    }
  } catch {
    // 줄이기에 실패해도 원본으로 올린다
    return original
  }
}

/** "3.2MB" 처럼 읽기 쉬운 크기 문자열 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
