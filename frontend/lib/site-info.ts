'use client'

import { useEffect, useState } from 'react'

export interface SiteInfo {
  festivalName: string
  organizer: string
  year: string
  contactEmail: string
  contactPhone: string
  address: string
  snsLinks: {
    instagram?: string
    facebook?: string
    youtube?: string
    blog?: string
  }
}

// 관리자 설정(/admin/settings)에서 값을 안 채웠거나 아직 못 불러왔을 때 쓰는 값.
// 지금 화면 곳곳에 박혀 있던 값과 똑같이 맞춰서, 이 훅으로 바꿔도 당장은
// 화면이 그대로 보이게 한다 — 관리자가 값을 바꿔 저장해야 비로소 달라진다
export const defaultSiteInfo: SiteInfo = {
  festivalName: '2026 가을연극축제',
  organizer: '전국직장인연극단체협의회',
  year: '2026',
  contactEmail: 'kayasism@naver.com',
  contactPhone: '010-9073-8894',
  address: '서울 관악구 남부순환로272길 22 2층',
  snsLinks: {
    instagram: 'https://www.instagram.com/jikplay1997',
    facebook: 'https://www.facebook.com/jikplay/?locale=ko_KR',
    youtube: '',
    blog: '',
  },
}

/**
 * 사이트 정보(연락처·SNS 링크)를 관리자 설정에서 불러오는 훅.
 * 여러 페이지(푸터, 히어로, 오시는 길, 극단 참가 신청)가 같은 값을 쓰므로 공용으로 뺐다.
 */
export function useSiteInfo(): SiteInfo {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo)

  useEffect(() => {
    let active = true

    fetch('/api/site-config?key=siteInfo')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        const value = data?.data?.value
        if (!value) return

        // 서버 값에 일부 필드가 비어 있을 수 있어 기본값과 병합한다
        // (빈 문자열은 "아직 안 채움"으로 보고 기본값을 그대로 쓴다)
        setSiteInfo({
          ...defaultSiteInfo,
          ...value,
          contactEmail: value.contactEmail || defaultSiteInfo.contactEmail,
          contactPhone: value.contactPhone || defaultSiteInfo.contactPhone,
          address: value.address || defaultSiteInfo.address,
          snsLinks: {
            ...defaultSiteInfo.snsLinks,
            ...Object.fromEntries(
              Object.entries(value.snsLinks || {}).filter(([, v]) => v)
            ),
          },
        })
      })
      .catch(() => {
        // 설정을 못 불러와도 기본값(현재 화면과 동일한 값)으로 계속 보여준다
      })

    return () => {
      active = false
    }
  }, [])

  return siteInfo
}
