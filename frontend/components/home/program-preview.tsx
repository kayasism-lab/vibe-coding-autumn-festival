'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Program = {
  _id: string
  title: string
  type: 'play' | 'musical' | 'short_play'
  company: string
  synopsis: string
}

const typeLabels: Record<Program['type'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  play: { label: '연극', variant: 'default' },
  musical: { label: '뮤지컬', variant: 'secondary' },
  short_play: { label: '단막극', variant: 'outline' },
}

export function ProgramPreview() {
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    fetch('/api/programs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrograms(data.data.slice(0, 6))
      })
  }, [])

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">Programs</p>
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">2026 가을연극축제 프로그램</h2>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/programs">
              전체 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">등록된 프로그램이 없습니다.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Link key={program._id} href={`/programs/${program._id}`} className="group block">
                <article className="h-full rounded-xl border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <Badge variant={typeLabels[program.type].variant}>{typeLabels[program.type].label}</Badge>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-card-foreground transition-colors group-hover:text-primary">{program.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{program.company}</p>
                  <p className="line-clamp-2 text-sm leading-relaxed text-card-foreground/80">{program.synopsis}</p>
                  <div className="mt-4 flex items-center border-t pt-4 text-sm font-medium text-primary">
                    자세히 보기
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
