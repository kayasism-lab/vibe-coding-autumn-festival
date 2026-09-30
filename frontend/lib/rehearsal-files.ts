/**
 * 연습일지 첨부 파일 올리기·받기.
 *
 * 사진과 달리 첨부 파일은 Cloudinary가 아니라 백엔드 서버 디스크에 둔다
 * (로그인한 연습일지 계정만 받을 수 있고, Cloudinary 무료 한도를 쓰지 않는다).
 * 요청이 Vercel을 거쳐 백엔드로 가는데 그 길목이 큰 본문을 막을 수 있어,
 * 올릴 때도 받을 때도 3MB 조각으로 나눈다. 서버 규칙은 backend/src/routes/rehearsal-files.ts
 */
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import type { RehearsalFile } from '@/lib/rehearsal'

/** 파일 한 개의 최대 크기. 서버(backend/src/lib/rehearsal-files.ts)와 같은 값 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024
/** 일지 한 건에 붙일 수 있는 파일 수 (서버와 같은 값) */
export const MAX_FILES_PER_LOG = 10

const CHUNK_SIZE = 3 * 1024 * 1024

// 실행 파일 같은 위험한 형식이 올라오지 않게 허용 목록으로 둔다 (서버와 같은 목록)
const ALLOWED_EXTENSIONS = [
  'pdf', 'hwp', 'hwpx', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip',
  'mp3', 'm4a', 'wav', 'mp4', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'webp',
]

/** 파일 고르기 창에 보여줄 형식 (input의 accept) */
export const ATTACHMENT_ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/** 올리기 전에 파일을 검사한다. 문제없으면 null */
export function validateAttachment(file: File): string | null {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `"${file.name}"은(는) 올릴 수 없는 형식입니다. (PDF·한글·워드·엑셀·파워포인트·압축·음성·영상 파일만 가능)`
  }
  if (file.size === 0) return `"${file.name}"은(는) 빈 파일입니다.`
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `"${file.name}"의 용량이 너무 큽니다. (${mb}MB / 최대 10MB)`
  }
  return null
}

/** 파일 한 개를 조각으로 나눠 올리고, 일지에 붙일 정보(주소·이름·크기)를 돌려준다 */
export async function uploadAttachment(file: File, onProgress?: (ratio: number) => void): Promise<RehearsalFile> {
  const startRes = await adminFetch('/api/rehearsal-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, size: file.size }),
  })
  if (!startRes.ok) throw new Error(await getErrorMessage(startRes))
  const { id } = (await startRes.json()).data as { id: string }

  let result: RehearsalFile | null = null
  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const res = await adminFetch(`/api/rehearsal-files/${id}?offset=${offset}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file.slice(offset, offset + CHUNK_SIZE),
    })
    if (!res.ok) throw new Error(await getErrorMessage(res))
    const data = (await res.json()).data as RehearsalFile & { received: number; complete: boolean }
    onProgress?.(data.received / file.size)
    if (data.complete) result = { url: data.url, name: data.name, size: data.size }
  }
  if (!result) throw new Error('파일을 끝까지 올리지 못했습니다. 다시 시도해주세요.')
  return result
}

/** 파일을 조각으로 받아 하나로 합친 뒤 원래 이름으로 저장한다 */
export async function downloadAttachment(file: RehearsalFile) {
  const parts: Blob[] = []
  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const res = await adminFetch(`${file.url}?offset=${offset}&length=${CHUNK_SIZE}`)
    if (!res.ok) throw new Error(await getErrorMessage(res))
    parts.push(await res.blob())
  }

  const objectUrl = URL.createObjectURL(new Blob(parts))
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
