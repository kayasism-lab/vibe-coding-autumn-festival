'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Film,
  Calendar,
  FileText,
  MessageSquare,
  Images,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  MapPin,
  ClipboardList,
  UserCog,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { GROUP_PERMISSION_META, resolveGroupHomeHref, type GroupPermission } from '@/lib/admin-permissions'

const fullSidebarItems = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
  { href: '/admin/programs', icon: Film, label: '프로그램 관리' },
  { href: '/admin/theater-groups', icon: Users, label: '참여 극단 관리' },
  { href: '/admin/schedules', icon: Calendar, label: '일정 관리' },
  { href: '/admin/venues', icon: MapPin, label: '공연장 관리' },
  { href: '/admin/applications', icon: ClipboardList, label: '참가 신청 관리' },
  { href: '/admin/citizen-applications', icon: ClipboardList, label: '시민 참여 신청 관리' },
  { href: '/admin/notices', icon: FileText, label: '게시판 관리' },
  { href: '/admin/inquiries', icon: MessageSquare, label: '문의 관리' },
  { href: '/admin/gallery', icon: Images, label: '갤러리 관리' },
  { href: '/admin/sponsors', icon: Building2, label: '후원사 관리' },
  { href: '/admin/users', icon: UserCog, label: '사용자 관리' },
  { href: '/admin/settings', icon: Settings, label: '사이트 설정' },
]

// 극단 담당자(group) 계정의 메뉴는 권한 키에 따라 결정된다.
// 기본 권한(내 극단·작품)은 항상 표시되고, 나머지는 관리자가 부여한 경우에만 나타난다.
const groupMenuByPermission: Record<GroupPermission, { href: string; icon: typeof Users; label: string }> = {
  'my-group': { href: '/admin/my-group', icon: Users, label: '내 극단 관리' },
  programs: { href: '/admin/programs', icon: Film, label: '작품 관리' },
  schedules: { href: '/admin/schedules', icon: Calendar, label: '공연 일정 관리' },
  gallery: { href: '/admin/gallery', icon: Images, label: '갤러리 관리' },
  notices: { href: '/admin/notices', icon: FileText, label: '게시판 관리' },
  inquiries: { href: '/admin/inquiries', icon: MessageSquare, label: '문의 답변' },
  'citizen-applications': { href: '/admin/citizen-applications', icon: ClipboardList, label: '참여 신청자 관리' },
}

// 낭독극·단막극 담당 계정은 담당 유형에 맞는 메뉴 이름으로 보여준다
const citizenApplicationsLabelByProgramType: Record<string, string> = {
  reading: '낭독극 신청자 관리',
  short_play: '단막극 신청자 관리',
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isGroupRole, setIsGroupRole] = useState(false)
  const [permissions, setPermissions] = useState<GroupPermission[]>([])
  const [programType, setProgramType] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.role === 'group') {
          setIsGroupRole(true)
          setPermissions(data.data.permissions ?? [])
          setProgramType(data.data.programType ?? null)
        }
      })
      .catch(() => {})
  }, [])

  // 권한 목록 순서가 아니라 메뉴 정의 순서대로 노출해 화면 순서가 계정마다 흔들리지 않게 한다
  const groupSidebarItems = GROUP_PERMISSION_META.filter((meta) => permissions.includes(meta.key)).map((meta) => {
    const item = groupMenuByPermission[meta.key]
    if (meta.key === 'citizen-applications' && programType && citizenApplicationsLabelByProgramType[programType]) {
      return { ...item, label: citizenApplicationsLabelByProgramType[programType] }
    }
    return item
  })

  const sidebarItems = isGroupRole ? groupSidebarItems : fullSidebarItems
  // my-group 권한이 없는 극단 계정(낭독극·단막극 담당자)도 있어, 실제로 가진 권한 중
  // 첫 메뉴로 보낸다
  const homeHref = isGroupRole ? resolveGroupHomeHref(permissions) : '/admin'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href={homeHref} className="font-bold text-foreground">
          관리자
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-foreground"
          aria-label="메뉴"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300',
          'lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link href={homeHref} className="block">
              <span className="text-lg font-bold text-foreground">
                2026 가을연극축제
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                관리자 패널
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              <Link href="/" target="_blank">
                사이트 보기
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
