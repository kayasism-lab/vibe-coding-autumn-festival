/**
 * 연습일지 첨부 파일 보관 (대본·악보·녹음 등).
 *
 * 사진·영상은 Cloudinary에 두지만, 첨부 파일은 이 서버의 디스크에 둔다(사용자 결정, 2026-09-30).
 * - Cloudinary 무료 한도를 아끼고
 * - 주소만 알면 누구나 받는 Cloudinary와 달리, 로그인한 연습일지 계정만 받게 하려는 것이다.
 *
 * 운영에서는 FILE_STORAGE_DIR을 Cloudtype의 '영구 디스크' 마운트 경로로 지정해야 한다.
 * 그렇지 않으면 재배포할 때 파일이 모두 사라진다.
 *
 * 디스크에는 파일마다 세 가지가 놓인다.
 *   <id>.json  이름·크기·올린 사람 (메타 정보)
 *   <id>.part  올리는 중인 조각 모음
 *   <id>.bin   다 올라온 파일
 */
import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { env } from './env.js'

/** 파일 한 개의 최대 크기. 화면(frontend/lib/rehearsal-files.ts)과 같은 값 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024
/** 일지 한 건에 붙일 수 있는 파일 수 */
export const MAX_FILES_PER_LOG = 10

// 실행 파일 같은 위험한 형식이 올라오지 않게 허용 목록으로 둔다 (화면과 같은 목록)
const ALLOWED_EXTENSIONS = [
  'pdf', 'hwp', 'hwpx', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip',
  'mp3', 'm4a', 'wav', 'mp4', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'webp',
]

const URL_PREFIX = '/api/rehearsal-files/'
const ID_PATTERN = /^[a-f0-9]{32}$/

export interface FileMeta {
  name: string
  size: number
  /** 올린 계정 id. 일지에 붙기 전에는 올린 사람만 받을 수 있다 */
  uploadedBy: string
  createdAt: string
  /** 조각이 전부 올라왔는지 */
  complete: boolean
}

export function isFileId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

export function fileUrl(id: string) {
  return `${URL_PREFIX}${id}`
}

/** 일지에 저장된 주소에서 파일 id를 꺼낸다. 형식이 다르면 null */
export function fileIdFromUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.startsWith(URL_PREFIX)) return null
  const id = url.slice(URL_PREFIX.length)
  return isFileId(id) ? id : null
}

// id는 위 형식(16진수 32자)만 받으므로 경로를 벗어나는 값이 섞일 수 없다
const filePath = (id: string, suffix: 'json' | 'part' | 'bin') => path.join(env.fileStorageDir, `${id}.${suffix}`)

/** 올릴 수 있는 파일인지 검사한다. 문제없으면 null */
export function validateUpload(name: string, size: number): string | null {
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  if (!ALLOWED_EXTENSIONS.includes(extension)) return '올릴 수 없는 파일 형식입니다.'
  if (!Number.isInteger(size) || size <= 0) return '빈 파일은 올릴 수 없습니다.'
  if (size > MAX_FILE_SIZE) return '파일은 한 개에 10MB까지 올릴 수 있습니다.'
  return null
}

export async function readMeta(id: string): Promise<FileMeta | null> {
  try {
    return JSON.parse(await fs.readFile(filePath(id, 'json'), 'utf8')) as FileMeta
  } catch {
    return null
  }
}

/** 올리기 시작: 메타 정보를 적어 두고 파일 id를 돌려준다 */
export async function createUpload(name: string, size: number, uploadedBy: string): Promise<string> {
  await fs.mkdir(env.fileStorageDir, { recursive: true })
  const id = randomBytes(16).toString('hex')
  const meta: FileMeta = { name, size, uploadedBy, createdAt: new Date().toISOString(), complete: false }
  await fs.writeFile(filePath(id, 'json'), JSON.stringify(meta))
  return id
}

/**
 * 조각 하나를 이어 붙인다. 지금까지 받은 크기와 offset이 같아야 한다
 * (같은 조각을 두 번 보내거나 순서가 어긋나면 파일이 망가지므로 거절한다).
 * 돌려주는 값은 { received: 지금까지 받은 크기, complete: 다 받았는지 }, 문제가 있으면 안내 문구
 */
export async function appendChunk(id: string, meta: FileMeta, offset: number, chunk: Buffer) {
  if (meta.complete) return '이미 다 올라온 파일입니다.'

  const partPath = filePath(id, 'part')
  const received = await fs.stat(partPath).then((stat) => stat.size, () => 0)
  if (offset !== received) return '파일 조각의 순서가 맞지 않습니다. 처음부터 다시 올려주세요.'
  if (chunk.length === 0 || received + chunk.length > meta.size) return '파일 크기가 맞지 않습니다.'

  await fs.appendFile(partPath, chunk)
  const total = received + chunk.length
  if (total < meta.size) return { received: total, complete: false }

  await fs.rename(partPath, filePath(id, 'bin'))
  await fs.writeFile(filePath(id, 'json'), JSON.stringify({ ...meta, complete: true }))
  return { received: total, complete: true }
}

/** 다 올라온 파일의 일부를 읽는다 (내려받기도 조각으로 나눠 보낸다) */
export async function readSlice(id: string, offset: number, length: number): Promise<Buffer> {
  const handle = await fs.open(filePath(id, 'bin'), 'r')
  try {
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, offset)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

/** 파일과 메타 정보를 지운다. 이미 없으면 조용히 넘어간다 */
export async function removeFile(id: string) {
  await Promise.all(
    (['json', 'part', 'bin'] as const).map((suffix) => fs.rm(filePath(id, suffix), { force: true }))
  )
}

/** 일지에 저장된 주소 목록에 해당하는 파일을 지운다 (일지를 지우거나 파일을 뺐을 때) */
export async function removeFilesByUrl(urls: string[]) {
  for (const url of urls) {
    const id = fileIdFromUrl(url)
    if (id) await removeFile(id).catch(() => {})
  }
}

/**
 * 화면이 보낸 첨부 목록을 저장할 값으로 바꾼다.
 * 이름·크기는 화면 값을 믿지 않고 디스크의 메타 정보에서 읽고, 다 올라오지 않았거나 없는 파일은 뺀다
 */
export async function resolveFiles(value: unknown): Promise<{ url: string; name: string; size: number }[]> {
  if (!Array.isArray(value)) return []
  const files: { url: string; name: string; size: number }[] = []
  for (const item of value) {
    const id = fileIdFromUrl((item as { url?: unknown } | null)?.url)
    if (!id || files.some((file) => file.url === fileUrl(id))) continue
    const meta = await readMeta(id)
    if (!meta?.complete) continue
    files.push({ url: fileUrl(id), name: meta.name, size: meta.size })
    if (files.length >= MAX_FILES_PER_LOG) break
  }
  return files
}
