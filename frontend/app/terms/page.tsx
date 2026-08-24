import type { Metadata } from 'next'
import { LegalDocumentPage } from '@/components/shared/legal-document'
import { termsOfService } from '@/lib/legal/terms-of-service'

export const metadata: Metadata = {
  title: '이용약관',
  description: '가을연극축제 홈페이지 이용에 관한 조건과 절차를 안내합니다.',
}

export default function TermsPage() {
  return <LegalDocumentPage document={termsOfService} />
}
