import { AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import type { LegalBlock, LegalDocument } from '@/lib/legal/types'

/** 조항 본문 조각 하나를 그린다 */
function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'text') {
    return (
      <p className="whitespace-pre-line leading-[1.9] text-muted-foreground">{block.value}</p>
    )
  }

  if (block.type === 'list') {
    return (
      <ul className="space-y-2">
        {block.items.map((item, index) => (
          <li key={index} className="flex gap-2.5 leading-[1.9] text-muted-foreground">
            <span aria-hidden className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span className="whitespace-pre-line">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  // 표는 항목이 많아 모바일에서 넘칠 수 있으므로 표 자체만 가로 스크롤시킨다
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/60">
            {block.headers.map((header) => (
              <th key={header} className="border-b px-4 py-3 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="whitespace-pre-line px-4 py-3 align-top leading-relaxed text-muted-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 개인정보처리방침·이용약관 등 법적 고지 문서를 공통 레이아웃으로 렌더링한다 */
export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const isDraft = document.pendingItems.length > 0

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="chair"
          subtitle={document.subtitle}
          title={document.title}
          description={document.description}
        />

        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* 확정되지 않은 항목이 남아 있으면 공개 전임을 명확히 알린다 */}
            {isDraft && (
              <div className="mb-12 rounded-lg border border-destructive/40 bg-destructive/5 p-5">
                <p className="flex items-center gap-2 font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  초안 — 아직 확정되지 않은 문서입니다
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  아래 항목이 확정되어야 정식으로 효력이 발생합니다. 확정 후 이 안내는 사라집니다.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {document.pendingItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="text-destructive">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-12">
              {document.sections.map((section) => (
                <section key={section.title} className="space-y-4">
                  <h2 className="text-lg font-bold tracking-tight sm:text-xl">{section.title}</h2>
                  {section.blocks.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                </section>
              ))}
            </div>

            <p className="mt-14 border-t pt-6 text-sm text-muted-foreground">
              {document.effectiveDate
                ? `이 문서는 ${document.effectiveDate}부터 시행됩니다.`
                : '시행일자가 확정되지 않았습니다.'}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
