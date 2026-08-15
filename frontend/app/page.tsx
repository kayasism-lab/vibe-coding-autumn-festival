import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { CountdownSection } from '@/components/home/countdown-section'
import { PerformanceNews } from '@/components/home/performance-news'
import { NoticeTabs } from '@/components/home/notice-tabs'
import { GalleryPreview } from '@/components/home/gallery-preview'
import { QuickMenu } from '@/components/home/quick-menu'
import { OrganizerBar } from '@/components/shared/organizer-bar'

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
        <section className="bg-muted py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <OrganizerBar theme="light" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
