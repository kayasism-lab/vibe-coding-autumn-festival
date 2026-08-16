'use client'

import { MapPin } from 'lucide-react'

interface VenueMapButtonProps {
  address?: string
  iconClassName?: string
}

// 지도 확대 레벨. 네이버 지도는 대략 6(전국)~21(건물 단위)이며,
// 검색 기본값은 너무 넓게 잡혀서 건물이 보이는 수준으로 당겨둔다. 이 값만 바꾸면 전 페이지에 반영된다.
const MAP_ZOOM_LEVEL = 17

// 네이버 지도에서 주소를 검색해 새 탭으로 연다.
// 아이콘 버튼과 주소 텍스트 링크가 같은 동작을 하므로 한 곳으로 모아둔다.
// c 파라미터는 신버전 지도(map.naver.com/p)의 뷰포트 지정 형식: {확대레벨},{기울기},{회전},{?},{지도종류}
function openVenueMap(address: string) {
  window.open(
    `https://map.naver.com/p/search/${encodeURIComponent(address)}?c=${MAP_ZOOM_LEVEL}.00,0,0,0,dh`,
    '_blank',
    'noopener,noreferrer'
  )
}

// 공연장 주소가 등록된 경우에만 파란색으로 활성화되는 위치 아이콘.
// 클릭하면 네이버 지도에서 해당 주소를 검색한다. <a> 대신 버튼 + window.open을 써서
// 카드 전체가 Link로 감싸진 곳(공연 목록 카드 등)에서도 링크 중첩 없이 안전하게 동작한다.
export function VenueMapButton({ address, iconClassName = 'h-4 w-4' }: VenueMapButtonProps) {
  if (!address) {
    return <MapPin className={`${iconClassName} text-muted-foreground`} />
  }

  return (
    <button
      type="button"
      title="네이버 지도에서 위치 보기"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        openVenueMap(address)
      }}
      className="text-blue-600 hover:text-blue-700 transition-colors"
    >
      <MapPin className={iconClassName} />
    </button>
  )
}

// 공연장 주소를 파란 글씨로 노출하고, 클릭하면 아이콘과 동일하게 지도를 여는 링크.
// 주소가 등록되지 않은 공연장에서는 아무것도 렌더링하지 않는다.
export function VenueAddressLink({ address, className = '' }: { address?: string; className?: string }) {
  if (!address) return null

  return (
    <button
      type="button"
      title="네이버 지도에서 위치 보기"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        openVenueMap(address)
      }}
      className={`text-left text-blue-600 underline-offset-2 transition-colors hover:text-blue-700 hover:underline ${className}`}
    >
      {address}
    </button>
  )
}
