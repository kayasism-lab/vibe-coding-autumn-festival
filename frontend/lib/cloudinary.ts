// Cloudinary 이미지 업로드.
//
// 예전에는 Cloudinary가 제공하는 업로드 위젯(외부 스크립트 + iframe)을 썼지만,
// 위젯이 iframe을 document.body에 직접 붙이는 탓에 Radix Dialog(관리자 팝업) 안에서는
// 조작이 전혀 되지 않았다. Dialog가 modal이면 body에 pointer-events:none을 걸고(클릭 차단),
// 팝업 밖으로 나간 포커스를 다시 팝업으로 되돌리기(파일 선택창이 안 열림) 때문이다.
// 그래서 위젯을 걷어내고 업로드 API를 직접 호출하는 방식으로 바꿨다.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

/** Cloudinary 무료 플랜의 이미지 업로드 상한과 맞춘 값 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 환경변수가 빠져 있으면 안내 문구를 돌려준다.
 * NEXT_PUBLIC_ 값은 빌드 시점에 박히므로, 값을 넣은 뒤에는 서버를 다시 띄워야 반영된다.
 */
export function getConfigError(): string | null {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return '이미지 업로드 설정(NEXT_PUBLIC_CLOUDINARY_*)이 없습니다. 관리자에게 문의해주세요.'
  }
  return null
}

/** 업로드 전에 파일을 검사한다. 문제없으면 null */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}"은(는) 이미지 파일이 아닙니다.`
  }
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `"${file.name}"의 용량이 너무 큽니다. (${mb}MB / 최대 10MB)`
  }
  return null
}

interface UploadOptions {
  /** Cloudinary에 저장될 폴더 경로 */
  folder?: string
  /** 0~1 사이의 진행률. 업로드 중 여러 번 호출된다 */
  onProgress?: (ratio: number) => void
}

/**
 * 이미지 한 장을 올리고 secure_url을 돌려준다.
 *
 * fetch가 아니라 XMLHttpRequest를 쓰는 이유: fetch는 업로드 진행률을 알려주지 않는다.
 * 사진 여러 장을 올릴 때 화면이 멈춘 것처럼 보이지 않게 하려면 진행률이 필요하다.
 */
export function uploadImage(file: File, options: UploadOptions = {}): Promise<string> {
  const configError = getConfigError()
  if (configError) return Promise.reject(new Error(configError))

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    // unsigned preset이라 API secret 없이 브라우저에서 바로 올릴 수 있다
    formData.append('upload_preset', UPLOAD_PRESET as string)
    if (options.folder) formData.append('folder', options.folder)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded / event.total)
    }

    xhr.onload = () => {
      let body: { secure_url?: string; error?: { message?: string } } = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error('업로드 응답을 이해할 수 없습니다. 잠시 후 다시 시도해주세요.'))
        return
      }

      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
        resolve(body.secure_url)
        return
      }
      // Cloudinary는 실패 사유를 error.message로 내려준다 (예: preset 이름이 틀린 경우)
      reject(new Error(body.error?.message || `업로드에 실패했습니다. (오류 ${xhr.status})`))
    }

    xhr.onerror = () => {
      reject(new Error('네트워크 오류로 업로드하지 못했습니다. 연결을 확인해주세요.'))
    }

    xhr.send(formData)
  })
}
