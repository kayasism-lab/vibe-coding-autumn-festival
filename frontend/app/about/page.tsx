import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = {
  title: '축제소개',
  description:
    '2026 가을연극축제(직장인들의 이중생활)를 소개합니다. 전국직장인연극단체협의회 주최, 서울시 후원, 전석 무료 시민참여형 생활문화예술축제입니다.',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          subtitle="About"
          title="축제 소개"
          description={`시민이 관객에서 창작자로, 마침내 무대의 주체로 성장하는\n과정형 생활문화예술축제, 2026 가을연극축제를 소개합니다.`}
        />

        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Festival Introduction */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  2026 가을연극축제: 직장인들의 이중생활
                </h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p className="leading-relaxed mb-4">
                    가을연극축제는 직장인들이 업무 외 시간을 활용하여 준비하고
                    무대에 올리는 시민참여형 연극 축제입니다. 낮에는 각자의 직장에서 일하고,
                    밤과 주말에는 배우가 되어 열정을 불태우는 직장인 배우들의 무대를 만나보세요.
                  </p>
                  <p className="leading-relaxed mb-4">
                    2026년 축제는 공연을 보는 것에서 그치지 않습니다. 직장인 극단의 연극을
                    관람한 시민이 &lsquo;열린 낭독극&rsquo;을 통해 자신의 이야기를 대본으로 만들어
                    발표하고, 나아가 직장인 배우들과 함께 &lsquo;열린 단막극&rsquo;의 무대에
                    직접 서는 것까지 이어지는 <strong>과정형 생활문화예술축제</strong>입니다.
                  </p>
                  <p className="leading-relaxed">
                    연극에 관심은 있지만 막연히 부담을 느꼈던 시민이라면 누구나, 공개모집을 통해
                    이 축제의 참여자가 될 수 있습니다. 전 프로그램 무료입니다.
                  </p>
                </div>
              </div>

              {/* Festival Info */}
              <div className="space-y-8">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    축제 개요
                  </h3>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">기간</dt>
                      <dd className="font-medium text-card-foreground">2026년 9월 19일 ~ 11월 29일</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">장소</dt>
                      <dd className="font-medium text-card-foreground">서울시 소재 공연장 4곳</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">프로그램</dt>
                      <dd className="font-medium text-card-foreground">연극 2편 / 열린 낭독극 1 / 열린 단막극 1 (총 10회 공연)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">관람료</dt>
                      <dd className="font-medium text-card-foreground">전 프로그램 무료 (사전 예약)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">참여 극단</dt>
                      <dd className="font-medium text-card-foreground">5개 극단 (직연협 회원)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">주최 / 후원</dt>
                      <dd className="font-medium text-card-foreground">전국직장인연극단체협의회 / 서울시</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    연혁 &amp; 운영위원회
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    전국직장인연극단체협의회는 1997년 창립해 2001년 첫 가을연극축제를 개최한 이래,
                    2025년 제23회까지 이어오며 직장인 생활문화예술의 발표와 교류의 장을 마련해왔습니다.
                    2026년은 제24회를 맞이합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    축제는 조직위원장 문성환을 중심으로 사무국장 진주호, 각 극단 대표(놀이터·좋은사람들·아해·
                    연극패청년·함바꿈)로 구성된 운영위원회가 기획하고 운영합니다. 모든 참여자가
                    본업과 병행하며 자발적으로 시간과 노력을 기울여 축제를 만들어갑니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Festival Values */}
        <section className="py-16 lg:py-24 bg-muted">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                우리가 추구하는 가치
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  열정
                </h3>
                <p className="text-muted-foreground">
                  업무와 일상의 바쁨 속에서도 연극에 대한 
                  열정을 잃지 않는 직장인들의 이야기
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  소통
                </h3>
                <p className="text-muted-foreground">
                  무대와 객석이 함께 호흡하며 
                  만들어가는 살아있는 공연
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  성장
                </h3>
                <p className="text-muted-foreground">
                  매년 더 나은 무대를 위해 
                  끊임없이 배우고 발전하는 우리
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
