'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// 축제 시작일: 2026년 가을연극축제 개막일(극단 아해 공연 첫날)
const FESTIVAL_START = new Date('2026-09-19T00:00:00')

function calculateTimeLeft(): TimeLeft {
  const now = new Date()
  const difference = FESTIVAL_START.getTime() - now.getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return null
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'DAYS', labelKr: '일' },
    { value: timeLeft.hours, label: 'HOURS', labelKr: '시간' },
    { value: timeLeft.minutes, label: 'MIN', labelKr: '분' },
    { value: timeLeft.seconds, label: 'SEC', labelKr: '초' },
  ]

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-r from-primary via-pink-500 to-purple-500 text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <Sparkles className="absolute top-8 left-1/4 h-6 w-6 text-white/30 animate-pulse" />
        <PartyPopper className="absolute bottom-8 right-1/4 h-6 w-6 text-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left - Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-4">
              <PartyPopper className="h-4 w-4" />
              <span>2026 Autumn Theater Festival</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              축제 시작까지
            </h2>
            <p className="text-white/80 text-lg">
              설레는 마음으로 기다려주세요!
            </p>
          </div>

          {/* Center - Countdown */}
          <div className="flex items-center gap-3 sm:gap-5">
            {timeUnits.map((unit, index) => (
              <div key={unit.label} className="flex items-center gap-3 sm:gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-18 sm:w-24 h-18 sm:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                    <span className="text-3xl sm:text-5xl font-bold tabular-nums">
                      {String(unit.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="mt-3 text-xs sm:text-sm text-white/70 font-medium">
                    {unit.labelKr}
                  </span>
                </div>
                {index < timeUnits.length - 1 && (
                  <span className="text-3xl sm:text-4xl font-light text-white/50 -mt-6">
                    :
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Right - CTA */}
          <div className="flex-shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-full px-8 shadow-lg font-semibold"
            >
              <Link href="/schedule">
                일정 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
