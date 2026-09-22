'use client'

/**
 * 시민참여(열린 낭독극·열린 단막극) 접수가 열려 있는지 확인하는 훅.
 *
 * 홈 화면의 모집 띠와 히어로 버튼 배지가 같은 기준으로 켜지고 꺼져야 해서
 * 조회와 판정을 한곳에 모았다. 담당자가 작품 관리에서 접수 상태를 바꾸면
 * 홈 화면도 저절로 따라가므로 마감 후 띠를 따로 내릴 필요가 없다.
 */
import { useEffect, useState } from 'react'
import { resolveCitizenApplicationStatus, type CitizenProgramType } from '@/lib/citizen-application-status'

/** 접수 상태 판정에 필요한 만큼만 추린 작품 값 */
interface ProgramSummary {
  type?: string
  applicationStatus?: string | null
  openForApplication?: boolean | null
}

export interface CitizenApplicationOpenState {
  /** 열린 단막극 접수가 열려 있는지 */
  shortPlay: boolean
  /** 열린 낭독극 접수가 열려 있는지 */
  reading: boolean
  /** 조회가 끝났는지. 확인 전에는 띠·배지를 그리지 않아 화면이 깜빡이지 않는다 */
  isLoaded: boolean
}

const CLOSED_STATE: CitizenApplicationOpenState = { shortPlay: false, reading: false, isLoaded: true }

/**
 * 한 화면에서 모집 띠와 히어로 버튼이 함께 이 훅을 쓰므로 조회 결과를 나눠 쓴다.
 * 캐시가 없으면 같은 목록을 두 번 받아오게 된다.
 */
let cachedRequest: Promise<CitizenApplicationOpenState> | null = null

function fetchOpenState(): Promise<CitizenApplicationOpenState> {
  if (cachedRequest) return cachedRequest

  cachedRequest = fetch('/api/programs')
    .then((res) => res.json())
    .then((data) => {
      const programs: ProgramSummary[] = data?.success ? (data.data ?? []) : []

      // 서버가 신청을 붙이는 기준(같은 유형 중 첫 번째 공개 작품)과 맞춘다.
      // 목록은 노출 순서대로 오므로 유형별 첫 작품이 신청을 받는 작품이다
      const isOpen = (type: CitizenProgramType) => {
        const program = programs.find((item) => item.type === type)
        // 작품이 아직 없으면 resolveCitizenApplicationStatus가 '준비 중'으로 본다
        return program ? resolveCitizenApplicationStatus(program) === 'open' : false
      }

      return { shortPlay: isOpen('short_play'), reading: isOpen('reading'), isLoaded: true }
    })
    .catch(() => {
      // 실패한 결과를 캐시에 남기면 다음 화면에서도 계속 닫힌 상태로 보인다
      cachedRequest = null
      // 조회에 실패하면 모집 안내를 띄우지 않는다.
      // 실제로는 마감됐는데 '모집중'으로 보이는 쪽이 신청자에게 더 혼란스럽다
      return CLOSED_STATE
    })

  return cachedRequest
}

export function useCitizenApplicationOpen(): CitizenApplicationOpenState {
  const [state, setState] = useState<CitizenApplicationOpenState>({
    shortPlay: false,
    reading: false,
    isLoaded: false,
  })

  useEffect(() => {
    let isCurrent = true

    fetchOpenState().then((next) => {
      if (isCurrent) setState(next)
    })

    return () => {
      isCurrent = false
    }
  }, [])

  return state
}
