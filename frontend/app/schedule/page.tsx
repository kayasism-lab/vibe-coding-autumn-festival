'use client'

// 참고: 'use client' 페이지라 커스텀 메타데이터를 둘 수 없습니다.
// SEO용 서버 메타데이터가 필요해지면 Phase 7에서 서버/클라이언트 컴포넌트로 분리 예정.

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, Loader2, MapPin } from 'lucide-react'
import { ScheduleCard, type ScheduleCardData } from '@/components/schedule/schedule-card'
import { monthLabel } from '@/lib/format-date'

type RawSchedule = Omit<ScheduleCardData, 'program'> & {
  programId: ScheduleCardData['program'] | null
}

function groupByMonth(schedules: RawSchedule[]) {
  const groups: Record<string, ScheduleCardData[]> = {}

  for (const schedule of schedules) {
    if (!schedule.programId) continue // 연결된 프로그램이 삭제된 경우 등 방어적 처리
    const key = monthLabel(schedule.date)
    if (!groups[key]) groups[key] = []
    groups[key].push({ ...schedule, program: schedule.programId })
  }

  return groups
}

export default function SchedulePage() {
  const [groups, setGroups] = useState<Record<string, ScheduleCardData[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGroups(groupByMonth(data.data))
      })
      .finally(() => setIsLoading(false))
  }, [])

  const months = Object.keys(groups)

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          subtitle="Schedule"
          title="공연 일정"
          description="2026년 9월 19일부터 11월 29일까지 진행되는 가을연극축제의 전체 공연 일정입니다. 전 프로그램 무료입니다."
        />

        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : months.length === 0 ? (
              <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
                등록된 일정이 없습니다.
              </div>
            ) : (
              <Tabs defaultValue={months[0]} className="w-full">
                <TabsList
                  className="w-full max-w-md mx-auto mb-8 grid"
                  style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
                >
                  {months.map((month) => (
                    <TabsTrigger key={month} value={month}>
                      {month}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {months.map((month) => (
                  <TabsContent key={month} value={month}>
                    <div className="space-y-4">
                      {groups[month].map((schedule) => (
                        <ScheduleCard key={schedule._id} schedule={schedule} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {/* Legend */}
            <div className="mt-12 p-6 bg-muted rounded-xl">
              <h3 className="text-sm font-semibold text-foreground mb-4">안내사항</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>공연 일정은 사정에 따라 변경될 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>공연 시작 30분 전부터 입장 가능합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>전 프로그램 무료이며, 사전 예약을 통해 분산 입장합니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
