import type { Metadata } from 'next'
import { LegalDocumentPage } from '@/components/shared/legal-document'
import { privacyPolicy } from '@/lib/legal/privacy-policy'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '가을연극축제 홈페이지의 개인정보 수집·이용·보관에 관한 안내입니다.',
}

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyPolicy} />
}
