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
        <HeroSection />
        <CountdownSection />
        <PerformanceNews />
        <NoticeTabs />
        <GalleryPreview />
        <QuickMenu />
        {/* 주관/후원 로고는 Footer에서 한 번만 표시(중복 노출 방지) */}
      </main>
      <Footer />
    </>
  )
}
