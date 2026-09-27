'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Volume2, VolumeX } from 'lucide-react'
import {
  PROMO_NARROW_SIZE_LABEL,
  PROMO_VIDEO_SECONDS,
  PROMO_WIDTH_NARROW,
  PROMO_WIDTH_WIDE,
  getPromoPosterUrl,
  getPromoVideoUrl,
} from '@/lib/promo-video'

/**
 * 홈 화면 홍보 영상.
 *
 * 카운트다운과 갤러리 사이에 둔다. 홍보 영상이 전하는 것은 '어떤 분위기인지'라
 * 갤러리와 역할이 같고, 어두운 배경을 써서 갤러리와 한 덩어리로 읽히게 했다.
 *
 * **넓은 화면과 좁은 화면에서 다르게 동작한다** (사용자가 정한 방식):
 * - 넓은 화면: 화면에 들어오면 소리 없이 자동으로 재생한다
 * - 좁은 화면: 대표 이미지만 보여주고, 누른 사람에게만 영상을 내려보낸다
 *
 * 좁은 화면을 다르게 두는 이유는 두 가지다. 휴대폰 데이터를 말없이 쓰지 않기 위해서,
 * 그리고 무료 플랜의 월 대역폭을 아끼기 위해서다(`lib/promo-video.ts` 참고).
 */

/** 재생 방식. 화면 폭과 사용자의 시스템 설정을 보고 정한다 */
type PlayMode = 'auto' | 'tap'

export function PromoVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  // 마운트 전에는 화면 폭을 알 수 없다. null인 동안에는 대표 이미지만 그린다
  const [mode, setMode] = useState<PlayMode | null>(null)
  // 사용자가 직접 재생·소리를 켰는지. 켠 뒤에는 조작 막대를 보여주고 자동 재생을 하지 않는다
  const [engaged, setEngaged] = useState(false)
  const [muted, setMuted] = useState(true)

  const posterUrl = getPromoPosterUrl()

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const decide = () => {
      // 데이터 절약 모드를 켠 분에게는 자동으로 영상을 내려보내지 않는다.
      // 표준에 아직 없는 값이라 타입이 없어 단언이 필요하다
      const saveData =
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
          ?.saveData === true

      // '움직임 줄이기'를 켠 분에게도 저절로 움직이는 화면을 보여주지 않는다
      setMode(wide.matches && !reducedMotion.matches && !saveData ? 'auto' : 'tap')
    }

    decide()
    // 창을 줄이거나 화면을 돌리면 다시 판정한다
    wide.addEventListener('change', decide)
    reducedMotion.addEventListener('change', decide)
    return () => {
      wide.removeEventListener('change', decide)
      reducedMotion.removeEventListener('change', decide)
    }
  }, [])

  // React는 muted를 속성으로만 넘겨 실제 재생에 반영되지 않는 경우가 있어 직접 지정한다
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    if (mode !== 'auto') return
    const video = videoRef.current
    const frame = frameRef.current
    if (!video || !frame) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause()
          return
        }
        // 사용자가 소리를 켜고 보는 중이라면 저절로 다시 시작하지 않는다.
        // 스크롤로 돌아왔을 때 소리가 불쑥 나오면 놀라게 된다
        if (engaged) return
        // 자동재생은 무음일 때만 브라우저가 허용한다. 막히더라도
        // 대표 이미지가 남아 있고 눌러서 재생할 수 있으므로 조용히 넘긴다
        video.play().catch(() => {})
      },
      // 절반쯤 들어왔을 때 시작한다. 빠르게 지나가며 걸치는 것으로는 영상을 받지 않는다
      { threshold: 0.5 }
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [mode, engaged])

  /** 환경변수가 없어 주소를 만들 수 없으면 섹션을 아예 그리지 않는다 */
  if (!posterUrl) return null

  // 좁은 화면에는 더 작은 영상을 보낸다. 폭을 정하기 전에는 주소를 걸지 않아
  // 화면에 들어오기만 해도 영상을 받아버리는 일이 없게 한다
  const videoUrl =
    mode === null
      ? undefined
      : (getPromoVideoUrl(mode === 'auto' ? PROMO_WIDTH_WIDE : PROMO_WIDTH_NARROW) ?? undefined)

  /** 사용자가 직접 재생하거나 소리를 켤 때 */
  const engage = () => {
    const video = videoRef.current
    if (!video) return

    setEngaged(true)
    setMuted(false)
    video.muted = false
    video.play().catch(() => {
      // 소리 있는 재생이 막히면 무음으로라도 보여준다
      video.muted = true
      setMuted(true)
      video.play().catch(() => {})
    })
  }

  return (
    <section className="relative bg-foreground py-16 text-background lg:py-20">
      {/* 위는 카운트다운의 컬러 배경, 아래는 갤러리의 검은 배경이다.
          위쪽에만 얇은 선을 둬서 카운트다운과 경계를 만들고, 갤러리와는 자연스럽게 잇는다 */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-accent">
            Promotion
          </p>
          <h2 className="text-2xl font-bold sm:text-3xl">홍보 영상</h2>
          <p className="mt-2 text-sm text-background/70">
            {PROMO_VIDEO_SECONDS}초로 만나는 2026 가을연극축제
          </p>
        </div>

        <div
          ref={frameRef}
          className="relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-xl ring-1 ring-background/10"
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            loop
            playsInline
            // 대표 이미지만 먼저 보여주고, 재생이 시작될 때 영상을 받는다
            preload="none"
            controls={engaged}
            aria-label="2026 가을연극축제 홍보 영상"
            className="h-full w-full object-cover"
          />

          {/* 좁은 화면: 누를 때까지 영상을 받지 않으므로 재생 버튼을 크게 둔다.
              드는 데이터를 미리 알려줘야 휴대폰에서 마음 놓고 누를 수 있다 */}
          {mode === 'tap' && !engaged && (
            <button
              type="button"
              onClick={engage}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/30 transition-colors hover:bg-foreground/20"
              aria-label="홍보 영상 재생"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background/90 shadow-lg">
                <Play className="ml-1 h-7 w-7 fill-foreground text-foreground" />
              </span>
              <span className="rounded-full bg-foreground/70 px-3 py-1 text-xs font-medium text-background">
                {PROMO_VIDEO_SECONDS}초 · 데이터 {PROMO_NARROW_SIZE_LABEL}
              </span>
            </button>
          )}

          {/* 넓은 화면: 무음으로 이미 돌고 있으니 소리를 켜는 버튼만 작게 둔다.
              소리를 켜면 조작 막대가 나오므로 이 버튼은 감춘다 */}
          {mode === 'auto' && !engaged && (
            <button
              type="button"
              onClick={engage}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-foreground/70 px-3 py-2 text-xs font-medium text-background backdrop-blur-sm transition-colors hover:bg-foreground/90"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              소리 켜기
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
