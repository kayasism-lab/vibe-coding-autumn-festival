'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Sparkles, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VenueMapButton } from '@/components/shared/venue-map-button'

type Program = {
  _id: string
  title: string
  type: 'play' | 'short_play' | 'reading'
  company: string
  venue: string
  venueAddress?: string
  posterUrl?: string
}

const typeLabels: Record<Program['type'], { text: string; style: string }> = {
  play: { text: '연극', style: 'bg-gradient-to-r from-orange-500 to-pink-500' },
  reading: { text: '낭독극', style: 'bg-gradient-to-r from-teal-500 to-emerald-500' },
  short_play: { text: '단막극', style: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
}

const cardStyles = [
  { color: 'from-orange-400 to-pink-400', bgColor: 'bg-orange-50' },
  { color: 'from-pink-400 to-purple-400', bgColor: 'bg-pink-50' },
  { color: 'from-purple-400 to-indigo-400', bgColor: 'bg-purple-50' },
  { color: 'from-blue-400 to-cyan-400', bgColor: 'bg-blue-50' },
  { color: 'from-teal-400 to-emerald-400', bgColor: 'bg-teal-50' },
  { color: 'from-indigo-400 to-purple-400', bgColor: 'bg-indigo-50' },
]

export function PerformanceNews() {
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    fetch('/api/programs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrograms(data.data.slice(0, 6))
      })
  }, [])

  return (
    <section className="bg-gradient-to-b from-white to-secondary/30 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Performance News</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">참여 극단 & 공연</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">관리자에서 등록한 공연 정보를 확인하세요</p>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">등록된 공연이 없습니다.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program, index) => {
              const style = cardStyles[index % cardStyles.length]
              return (
                <Link key={program._id} href={`/programs/${program._id}`} className="group">
                  <article className={`${style.bgColor} overflow-hidden rounded-2xl border border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                    <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${style.color}`}>
                      {program.posterUrl ? (
                        <img src={program.posterUrl} alt={program.title} className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Users className="h-16 w-16 text-white/30" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <Badge className={`${typeLabels[program.type].style} border-0 text-white`}>
                          {typeLabels[program.type].text}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 text-xs font-medium text-white/70">
                        #{String(index + 1).padStart(2, '0')}
                      </div>
                    </div>

                    <div className="p-5">
                      <p className={`mb-2 bg-gradient-to-r ${style.color} bg-clip-text text-sm font-bold text-transparent`}>
                        {program.company}
                      </p>
                      <h3 className="mb-4 line-clamp-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                        {program.title}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>일정 준비 중</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <VenueMapButton address={program.venueAddress} />
                          <span>{program.venue}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-primary to-pink-500 px-8 hover:from-primary/90 hover:to-pink-500/90">
            <Link href="/programs">
              전체 프로그램 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
