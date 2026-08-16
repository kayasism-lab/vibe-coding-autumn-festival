// 협의회 창립부터 올해 축제까지의 흐름을 연표로 보여준다.
// 문단 속에 묻혀 있던 연도 정보를 꺼내 축제의 지속성을 한눈에 전달하는 것이 목적.
const milestones = [
  {
    year: '1997',
    title: '전국직장인연극단체협의회 창립',
    description: '직장인 극단들이 모여 발표와 교류의 장을 만들기 위해 협의회를 세웠습니다.',
  },
  {
    year: '2001',
    title: '제1회 가을연극축제 개최',
    description: '직장인 생활문화예술을 무대에 올리는 축제가 처음 열렸습니다.',
  },
  {
    year: '2025',
    title: '제23회 축제 마무리',
    description: '24년간 끊이지 않고 이어져 온 무대가 스물세 번째 해를 마쳤습니다.',
  },
  {
    year: '2026',
    title: '제24회 · 직장인들의 이중생활',
    description: '관람에서 참여로 이어지는 과정형 축제로 확장했습니다.',
    current: true,
  },
]

export function FestivalHistory() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow text-primary">History</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">연혁</h2>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {milestones.map(({ year, title, description, current }) => (
            <li key={year} className="relative">
              {/* 연도 위에 놓이는 가로 진행선 (마지막 항목은 선을 잇지 않음) */}
              <div className="mb-5 flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    current ? 'bg-primary ring-4 ring-primary/15' : 'bg-border'
                  }`}
                />
                <span className="h-px flex-1 bg-border" />
              </div>
              <p
                className={`tabular font-display text-3xl font-bold ${
                  current ? 'text-primary' : 'text-foreground/35'
                }`}
              >
                {year}
              </p>
              <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
