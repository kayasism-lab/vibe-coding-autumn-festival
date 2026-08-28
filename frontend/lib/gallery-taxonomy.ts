/**
 * 갤러리 분류에 쓰는 이름표를 한곳에 모아둔다.
 * 관리 화면과 공개 화면이 같은 값을 써야 표기가 어긋나지 않는다.
 */

import type { GalleryCategory, GalleryType } from '@/types'

export const GALLERY_TYPES: { value: GalleryType; label: string }[] = [
  { value: 'photo', label: '사진' },
  { value: 'video', label: '영상' },
]

export const GALLERY_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: 'festival', label: '가을연극축제' },
  { value: 'general', label: '일반공연' },
  { value: 'etc', label: '기타' },
]

export function getGalleryTypeLabel(type: GalleryType): string {
  return GALLERY_TYPES.find((item) => item.value === type)?.label ?? '사진'
}

/** 저장된 값이 목록에 없더라도 화면이 비지 않도록 '기타'로 받아준다 */
export function getGalleryCategoryLabel(category?: GalleryCategory): string {
  return GALLERY_CATEGORIES.find((item) => item.value === category)?.label ?? '기타'
}

/**
 * 극단 필드는 목록 API에서는 이름이 채워진 객체로, 저장할 때는 ID 문자열로 오간다.
 * 두 모양을 한 번에 다루려고 아래 두 함수를 쓴다.
 */
export type GalleryTheaterGroup = string | { _id: string; name: string } | null | undefined

export function getTheaterGroupId(value: GalleryTheaterGroup): string {
  if (!value) return ''
  return typeof value === 'string' ? value : value._id
}

export function getTheaterGroupName(value: GalleryTheaterGroup): string {
  if (!value || typeof value === 'string') return ''
  return value.name
}

/**
 * 최근에 올린 자료가 앞에 오도록 정렬한다.
 *
 * 서버도 같은 순서로 내려주지만, 화면에서 한 번 더 맞춰둔다.
 * 서버가 아직 예전 순서로 응답하더라도(배포 시점 차이) 보는 사람에게는
 * 늘 최신순으로 보이게 하기 위해서다.
 *
 * 새 자료일수록 order 값이 커지므로 order를 내림차순으로 본다.
 */
export function sortGalleryLatestFirst<T extends { order?: number; createdAt: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const byOrder = (b.order ?? 0) - (a.order ?? 0)
    if (byOrder !== 0) return byOrder
    // order가 같으면 나중에 올린 것을 앞에 둔다
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
