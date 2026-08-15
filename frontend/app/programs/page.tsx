'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react'
import { programTypeConfig as typeConfig } from '@/lib/program-display'
import type { ProgramType } from '@/types/index'

type Program = {
  _id: string
  title: string
  type: ProgramType
  company: string
  director?: string
  runtime: number
  venue: string
  synopsis: string
  posterUrl?: string
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [type, setType] = useState<'all' | Program['type']>('all')

  useEffect(() => {
    const query = type === 'all' ? '' : `?type=${type}`
    fetch(`/api/programs${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrograms(data.data)
      })
  }, [type])

  return (
    <>
      <Header />
      <main className="pt-[9.5rem]">
        <PageHeader subtitle="Programs" title="공연 프로그램" description="2026 가을연극축제 공연을 소개합니다." />
        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                ['all', '전체'],
                ['play', '연극'],
                ['musical', '뮤지컬'],
                ['short_play', '단막극'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setType(value as typeof type)}>
                  <Badge variant={type === value ? 'default' : 'outline'} className="cursor-pointer">{label}</Badge>
                </button>
              ))}
            </div>
            <div className="grid gap-8">
              {programs.map((program) => (
                <Link key={program._id} href={`/programs/${program._id}`} className="group block">
                  <article className="overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                    <div className="flex flex-col lg:flex-row">
                      <div className="h-48 flex-shrink-0 bg-muted lg:h-auto lg:w-64">
                        {program.posterUrl ? (
                          <img src={program.posterUrl} alt={program.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">포스터 준비 중</div>
                        )}
                      </div>
                      <div className="flex-1 p-6 lg:p-8">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className={`${typeConfig[program.type].bgClass} ${typeConfig[program.type].textClass}`}>{typeConfig[program.type].label}</Badge>
                        </div>
                        <h2 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary lg:text-2xl">{program.title}</h2>
                        <p className="mb-4 text-muted-foreground">{program.company}</p>
                        <p className="mb-6 line-clamp-2 leading-relaxed text-card-foreground/80">{program.synopsis}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{program.runtime}분</span>
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{program.venue}</span>
                          {program.director && <span className="flex items-center gap-1"><Users className="h-4 w-4" />연출: {program.director}</span>}
                        </div>
                        <div className="mt-6 flex items-center text-sm font-medium text-primary">자세히 보기<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
              {programs.length === 0 && <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">등록된 프로그램이 없습니다.</div>}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
