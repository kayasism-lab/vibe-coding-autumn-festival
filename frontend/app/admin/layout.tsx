import type { Metadata } from 'next'
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard'

export const metadata: Metadata = {
  title: {
    default: '관리자',
    template: '%s | 관리자 - 2026 가을연극축제',
  },
  robots: 'noindex, nofollow',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>
}
