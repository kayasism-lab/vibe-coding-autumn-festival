import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { FestivalJourney } from '@/components/about/festival-journey'
import { FestivalHistory } from '@/components/about/festival-history'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: '축제소개',
  description:
    '2026 가을연극축제(직장인들의 이중생활)를 소개합니다. 전국직장인연극단체협의회 주최·주관, 서울시 후원, 전석 무료 시민참여형 생활문화예술축제입니다.',
}

// 축제의 규모를 숫자 하나로 즉시 전달하는 지표들
const keyFigures = [
  { value: '24', unit: '회', label: '2001년 시작해 올해로' },
  { value: '5', unit: '개 극단', label: '직연협 회원 극단 참여' },
  { value: '10', unit: '회', label: '9월 19일부터 11월 29일까지' },
  { value: '0', unit: '원', label: '전 프로그램 무료 관람' },
]

// 축제 개요 표
const overview = [
  { label: '기간', value: '2026년 9월 19일(토) ~ 11월 29일(일)' },
  { label: '장소', value: '서울시 소재 공연장 4곳' },
  { label: '프로그램', value: '연극 2편 · 열린 낭독극 1 · 열린 단막극 1 (총 10회 공연)' },
  { label: '관람료', value: '전 프로그램 무료 (사전 예약제)' },
  { label: '참여 극단', value: '놀이터 · 좋은사람들 · 아해 · 연극패청년 · 함바꿈' },
  { label: '주최·주관', value: '전국직장인연극단체협의회' },
  { label: '후원', value: '서울시' },
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="chair"
          subtitle="About"
          title="축제 소개"
          description={`시민이 관객에서 창작자로, 마침내 무대의 주체로 성장하는\n과정형 생활문화예술축제, 2026 가을연극축제를 소개합니다.`}
        />

        {/* 리드 스테이트먼트 — 축제를 한 문장으로 정의하고 본문으로 풀어낸다 */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
              <h2 className="font-display text-2xl font-semibold leading-[1.45] text-foreground sm:text-[1.75rem] lg:text-3xl">
                낮에는 직장인,
                <br />
                밤에는 배우.
                <br />
                <span className="text-primary">그 이중생활이</span>
                <br />
                무대가 됩니다.
              </h2>

              <div className="space-y-5 text-base leading-[1.85] text-muted-foreground lg:text-lg">
                <p>
                  가을연극축제는 직장인들이 업무 외 시간을 쪼개어 준비하고 무대에 올리는
                  시민참여형 연극 축제입니다. 낮에는 각자의 직장에서 일하고, 밤과 주말에는
                  배우가 되어 연습실을 지킨 사람들의 무대를 만납니다.
                </p>
                <p>
                  2026년 축제는 공연을 보는 것에서 그치지 않습니다. 직장인 극단의 연극을 관람한
                  시민이 <strong className="font-semibold text-foreground">열린 낭독극</strong>을
                  통해 자신의 이야기를 대본으로 만들어 발표하고, 나아가 직장인 배우들과 함께{' '}
                  <strong className="font-semibold text-foreground">열린 단막극</strong>의 무대에
                  직접 서는 것까지 이어집니다.
                </p>
                <p>
                  연극에 관심은 있었지만 선뜻 시작하지 못했던 분이라면 누구나, 공개모집을 통해
                  이 축제의 참여자가 될 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 핵심 지표 — 규모와 지속성을 숫자로 */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-px bg-border px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {keyFigures.map(({ value, unit, label }) => (
              <div key={label} className="bg-secondary/40 px-2 py-10 text-center">
                <p className="tabular font-display text-4xl font-bold text-primary lg:text-5xl">
                  {value}
                  <span className="ml-1 text-lg font-semibold lg:text-xl">{unit}</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 과정형 축제 3단계 */}
        <FestivalJourney />

        {/* 축제 개요 + 운영 주체 */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
              <div>
                <p className="eyebrow text-primary">Overview</p>
                <h2 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
                  축제 개요
                </h2>

                <dl className="mt-10 divide-y divide-border border-t border-border">
                  {overview.map(({ label, value }) => (
                    <div key={label} className="grid gap-1 py-5 sm:grid-cols-[8rem_1fr] sm:gap-6">
                      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="lg:pt-20">
                <div className="rounded-2xl border border-border bg-card p-7 lg:p-8">
                  <h3 className="font-display text-xl font-semibold text-card-foreground">
                    누가 만드나요
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    축제는 조직위원장 문성환을 중심으로, 사무국장 진주호와 각 극단 대표로 구성된
                    운영위원회가 기획하고 운영합니다.
                  </p>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    모든 참여자가 본업과 병행하며 자발적으로 시간과 노력을 들여 한 해의 축제를
                    만들어갑니다.
                  </p>

                  <dl className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">조직위원장</dt>
                      <dd className="font-medium text-card-foreground">문성환</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">사무국장</dt>
                      <dd className="font-medium text-card-foreground">진주호</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">운영위원</dt>
                      <dd className="text-right font-medium text-card-foreground">
                        참여 5개 극단 대표
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 연혁 */}
        <FestivalHistory />

        {/* 소개를 다 읽은 사람이 다음에 할 행동으로 연결 */}
        <section className="border-t border-border bg-secondary/40 py-16 lg:py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                올가을, 객석에서 만날까요 무대에서 만날까요
              </h2>
              <p className="mt-3 text-muted-foreground">
                관람도 참여도 모두 무료입니다. 원하는 쪽으로 시작해보세요.
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/programs">
                  프로그램 보기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link href="/apply/citizen?type=reading">시민참여 신청</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
