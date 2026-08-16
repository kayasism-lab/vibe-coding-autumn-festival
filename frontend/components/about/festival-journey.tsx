import Link from 'next/link'
import { ArrowRight, Eye, Mic, Theater } from 'lucide-react'

// 이 축제의 정체성인 '과정형' 구조를 3단계로 시각화한다.
// 관람에서 끝나지 않고 참여 → 무대로 이어진다는 점이 핵심 메시지이므로
// 각 단계에서 바로 해당 페이지로 이동할 수 있게 연결한다.
const steps = [
  {
    step: '01',
    icon: Eye,
    label: '본다',
    title: '직장인 극단의 연극을 관람합니다',
    description:
      '낮에는 회사에서 일하고 밤과 주말에 무대를 준비한 직장인 배우들의 정식 공연을 만납니다. 전 프로그램 무료입니다.',
    href: '/programs',
    linkLabel: '공연 프로그램 보기',
  },
  {
    step: '02',
    icon: Mic,
    label: '말한다',
    title: '열린 낭독극에서 내 이야기를 읽습니다',
    description:
      '관객이었던 시민이 자신의 이야기를 대본으로 만들어 소리 내어 발표합니다. 연극 경험이 없어도 참여할 수 있습니다.',
    href: '/apply/citizen?type=reading',
    linkLabel: '열린 낭독극 신청',
  },
  {
    step: '03',
    icon: Theater,
    label: '선다',
    title: '열린 단막극의 무대에 직접 섭니다',
    description:
      '직장인 배우들과 함께 한 편의 단막극을 올립니다. 관객에서 창작자로, 마침내 무대의 주체가 되는 마지막 단계입니다.',
    href: '/apply/citizen?type=short_play',
    linkLabel: '열린 단막극 신청',
  },
]

export function FestivalJourney() {
  return (
    <section className="bg-foreground py-20 text-background lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-accent">Process</p>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            관객에서 무대의 주체까지, 세 단계
          </h2>
          <p className="mt-5 leading-relaxed text-background/70">
            가을연극축제는 공연을 보는 것으로 끝나지 않습니다. 관람한 시민이 자신의 이야기를
            발표하고, 끝내 직접 무대에 서는 과정형 생활문화예술축제입니다.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-background/15 sm:grid-cols-3">
          {steps.map(({ step, icon: Icon, label, title, description, href, linkLabel }) => (
            <li key={step} className="flex flex-col bg-foreground p-7 lg:p-9">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 text-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-xs tracking-[0.2em] text-background/40">STEP {step}</p>
                  <p className="font-semibold text-accent">{label}</p>
                </div>
              </div>

              <h3 className="mt-6 text-lg font-semibold leading-snug">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-background/60">{description}</p>

              <Link
                href={href}
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-background transition-colors hover:text-accent"
              >
                {linkLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
