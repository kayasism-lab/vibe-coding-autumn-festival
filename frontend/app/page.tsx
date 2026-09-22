import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { CitizenApplyStrip } from '@/components/home/citizen-apply-strip'
import { CountdownSection } from '@/components/home/countdown-section'
import { PerformanceNews } from '@/components/home/performance-news'
import { NoticeTabs } from '@/components/home/notice-tabs'
import { GalleryPreview } from '@/components/home/gallery-preview'
import { QuickMenu } from '@/components/home/quick-menu'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* 섹션 순서: 무엇을(히어로) → 언제(카운트다운) → 어떤 분위기인지(갤러리) → 무엇을 볼 수 있나 → 소식.
            사진이 축제 분위기를 가장 빨리 전하므로 공지 목록보다 앞에 둔다.
            컬러 그라데이션(카운트다운) 다음에 어두운 갤러리가 오면서 화면 대비도 살아난다 */}
        <HeroSection />
        {/* 시민참여 모집 띠는 첫 화면 바로 다음에 둔다.
            스크롤을 조금만 내려도 눈에 들어오면서, 접수가 없으면 통째로 빠져
            지금까지의 화면 순서(히어로 → 카운트다운)가 그대로 유지된다 */}
        <CitizenApplyStrip />
        <CountdownSection />
        <GalleryPreview />
        <PerformanceNews />
        <NoticeTabs />
        <QuickMenu />
        {/* 주최·주관/후원 로고는 Footer에서 한 번만 표시(중복 노출 방지) */}
      </main>
      <Footer />
    </>
  )
}
