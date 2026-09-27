import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { CitizenApplyStrip } from '@/components/home/citizen-apply-strip'
import { CountdownSection } from '@/components/home/countdown-section'
import { PromoVideoSection } from '@/components/home/promo-video-section'
import { PerformanceNews } from '@/components/home/performance-news'
import { NoticeTabs } from '@/components/home/notice-tabs'
import { GalleryPreview } from '@/components/home/gallery-preview'
import { QuickMenu } from '@/components/home/quick-menu'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* 섹션 순서: 무엇을(히어로) → 언제(카운트다운) → 어떤 분위기인지(홍보 영상·갤러리)
            → 무엇을 볼 수 있나 → 소식.
            사진이 축제 분위기를 가장 빨리 전하므로 공지 목록보다 앞에 둔다.
            컬러 그라데이션(카운트다운) 다음에 어두운 영상·갤러리가 오면서 화면 대비도 살아난다 */}
        <HeroSection />
        {/* 시민참여 모집 띠는 첫 화면 바로 다음에 둔다.
            스크롤을 조금만 내려도 눈에 들어오면서, 접수가 없으면 통째로 빠져
            지금까지의 화면 순서(히어로 → 카운트다운)가 그대로 유지된다 */}
        <CitizenApplyStrip />
        <CountdownSection />
        {/* 홍보 영상은 갤러리 바로 앞에 둔다. 둘 다 '어떤 분위기인지'를 전하는 자리라
            영상 → 사진 순으로 이어지고, 어두운 배경을 공유해 한 덩어리로 읽힌다 */}
        <PromoVideoSection />
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
