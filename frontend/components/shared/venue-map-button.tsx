'use client'

import { MapPin } from 'lucide-react'

interface VenueMapButtonProps {
  address?: string
  iconClassName?: string
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
        window.open(
          `https://map.naver.com/p/search/${encodeURIComponent(address)}`,
          '_blank',
          'noopener,noreferrer'
        )
      }}
      className="text-blue-600 hover:text-blue-700 transition-colors"
    >
      <MapPin className={iconClassName} />
    </button>
  )
}
