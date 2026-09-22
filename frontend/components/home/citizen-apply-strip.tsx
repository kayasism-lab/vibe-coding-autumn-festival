'use client'

/**
 * 홈 화면의 열린 단막극 배우 모집 띠.
 *
 * 히어로의 '시민참여 신청' 버튼은 신청 유형을 고르는 화면으로 보내므로,
 * 지금 모집 중인 단막극 배우 신청은 한 번 더 눌러야 닿는다.
 * 첫 화면 바로 아래에 한 줄짜리 띠를 두어 스크롤하자마자 눈에 들어오게 한다.
 *
 * 접수 상태가 '신청가능'일 때만 나오므로 마감하면 저절로 사라진다.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Drama, X } from 'lucide-react'
import { useCitizenApplicationOpen } from '@/lib/use-citizen-application-open'

/** 닫은 날짜를 적어두는 자리. 하루가 지나면 다시 보여준다 */
const DISMISS_KEY = 'citizen-apply-strip-dismissed'

/** 오늘 날짜(YYYY-MM-DD). 닫은 날과 비교해 하루만 숨기는 기준으로 쓴다 */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CitizenApplyStrip() {
  const { shortPlay, isLoaded } = useCitizenApplicationOpen()
  // 브라우저 저장값을 읽기 전에는 숨겨둔다.
  // 처음 그릴 때 띠가 보였다가 사라지면 화면이 한 번 덜컥 움직인다
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    try {
      setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === today())
    } catch {
      // 브라우저가 저장소를 막아둔 경우(시크릿 모드 등)에는 그냥 보여준다
      setIsDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, today())
    } catch {
      // 저장에 실패해도 이번 방문 동안은 닫힌 상태를 유지하므로 그대로 둔다
    }
  }

  if (!isLoaded || !shortPlay || isDismissed) return null

  return (
    <section className="relative border-y border-amber-400/30 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 pr-12 sm:px-6 sm:pr-14 lg:px-8">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 sm:flex">
          <Drama className="h-4 w-4 text-white" />
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          {/* 띠 배경이 앰버·오렌지라 반투명 흰 배지는 배경에 묻힌다.
              히어로 버튼의 배지와 같은 빨강으로 맞추고 배지째 깜빡이게 해서
              '지금 모집 중'이라는 것이 한눈에 들어오게 한다 */}
          <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md shadow-red-900/30 ring-1 ring-white/60">
            {/* 안쪽 점은 배지보다 빠르게 깜빡여 신호등처럼 보이게 한다 */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            모집중
          </span>
          <p className="text-sm font-semibold text-white sm:text-base">
            열린 단막극 <span className="text-amber-100">배우</span>를 모집합니다
          </p>
          <p className="hidden text-xs text-white/80 lg:block">
            연극 경험이 없어도 괜찮습니다. 시민 누구나 신청할 수 있습니다.
          </p>
        </div>

        <Link
          href="/apply/citizen?type=short_play"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm transition-colors hover:bg-amber-50 sm:text-sm"
        >
          신청하기
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 닫기는 띠 오른쪽 끝에 붙인다. 신청 버튼과 나란히 두면 잘못 누르기 쉽다 */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="오늘 하루 이 안내 닫기"
        title="오늘 하루 보지 않기"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white sm:right-3"
      >
        <X className="h-4 w-4" />
      </button>
    </section>
  )
}
