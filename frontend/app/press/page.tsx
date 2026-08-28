'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { NoticeBoard } from '@/components/notices/notice-board'
import { BoardCrossLink } from '@/components/notices/board-cross-link'
import { NOTICE_BOARD_CATEGORIES, PRESS_BOARD_CATEGORIES } from '@/lib/notice-board'

/**
 * 보도·미디어 게시판.
 * 공지사항과 성격이 달라 페이지를 나눴다. 예전 보도까지 쌓일 수 있어
 * 목록에서 올해와 그 이전을 나눠 볼 수 있게 했다.
 */
export default function PressPage() {
  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="stage"
          subtitle="Press"
          title="보도 · 미디어"
          description="언론에 소개된 소식과 영상·사진 자료를 모았습니다."
        />
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <NoticeBoard
              categories={PRESS_BOARD_CATEGORIES}
              emptyMessage="등록된 보도·미디어 자료가 없습니다."
            />
          </div>
        </section>

        {/* 반대쪽도 같은 자리에서 오갈 수 있게 둔다 */}
        <BoardCrossLink
          categories={NOTICE_BOARD_CATEGORIES}
          heading="공지사항"
          description="축제 진행에 관한 안내와 소식입니다."
          href="/notices"
          linkLabel="전체 보기"
        />
      </main>
      <Footer />
    </>
  )
}
