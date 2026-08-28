'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { NoticeBoard } from '@/components/notices/notice-board'
import { NOTICE_BOARD_CATEGORIES } from '@/lib/notice-board'

/**
 * 공지사항 게시판.
 * 보도자료·미디어는 성격이 달라 /press로 따로 뺐다. 예전에는 한 페이지에 섞여 있어
 * 홈 화면의 보도·미디어 영역과 같은 글이 두 번 보였다.
 */
export default function NoticesPage() {
  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="bulbs"
          subtitle="Notice"
          title="공지사항"
          description="축제 진행에 관한 안내와 소식을 확인하세요."
        />
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <NoticeBoard
              categories={NOTICE_BOARD_CATEGORIES}
              emptyMessage="등록된 공지사항이 없습니다."
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
