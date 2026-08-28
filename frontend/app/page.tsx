import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
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
