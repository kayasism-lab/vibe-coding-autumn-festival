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
  NotebookPen,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { MyAccountButton } from '@/components/admin/rehearsal/my-account-dialog'
import { GROUP_PERMISSION_META, resolveGroupHomeHref, type GroupPermission } from '@/lib/admin-permissions'

const fullSidebarItems = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
  { href: '/admin/programs', icon: Film, label: '프로그램 관리' },
  { href: '/admin/theater-groups', icon: Users, label: '참여 극단 관리' },
  { href: '/admin/schedules', icon: Calendar, label: '일정 관리' },
  { href: '/admin/venues', icon: MapPin, label: '공연장 관리' },
  { href: '/admin/applications', icon: ClipboardList, label: '참가 신청 관리' },
  { href: '/admin/citizen-applications', icon: ClipboardList, label: '시민 참여 신청 관리' },
  { href: '/admin/rehearsal-logs', icon: NotebookPen, label: '연습일지' },
  { href: '/admin/rehearsal-teams', icon: UsersRound, label: '연습일지 설정' },
  { href: '/admin/notices', icon: FileText, label: '게시판 관리' },
  { href: '/admin/inquiries', icon: MessageSquare, label: '문의 관리' },
  { href: '/admin/gallery', icon: Images, label: '갤러리 관리' },
  { href: '/admin/sponsors', icon: Building2, label: '후원사 관리' },
  { href: '/admin/users', icon: UserCog, label: '사용자 관리' },
  { href: '/admin/settings', icon: Settings, label: '사이트 설정' },
]

// 극단 담당자(group) 계정의 메뉴는 권한 키에 따라 결정된다.
// 기본 권한(내 극단·작품)은 항상 표시되고, 나머지는 관리자가 부여한 경우에만 나타난다.
// short는 휴대폰 아래 탭 막대에 쓰는 짧은 이름이다 (칸이 좁아 긴 이름은 두 줄로 접힌다)
const groupMenuByPermission: Record<GroupPermission, { href: string; icon: typeof Users; label: string; short: string }> = {
  'my-group': { href: '/admin/my-group', icon: Users, label: '내 극단 관리', short: '내 극단' },
  programs: { href: '/admin/programs', icon: Film, label: '작품 관리', short: '작품' },
  schedules: { href: '/admin/schedules', icon: Calendar, label: '공연 일정 관리', short: '일정' },
  gallery: { href: '/admin/gallery', icon: Images, label: '갤러리 관리', short: '갤러리' },
  notices: { href: '/admin/notices', icon: FileText, label: '게시판 관리', short: '게시판' },
  inquiries: { href: '/admin/inquiries', icon: MessageSquare, label: '문의 답변', short: '문의' },
  'citizen-applications': { href: '/admin/citizen-applications', icon: ClipboardList, label: '참여 신청자 관리', short: '신청자' },
  'rehearsal-logs': { href: '/admin/rehearsal-logs', icon: NotebookPen, label: '연습일지', short: '연습일지' },
  'rehearsal-teams': { href: '/admin/rehearsal-teams', icon: UsersRound, label: '연습일지 설정', short: '일지 설정' },
}

// 아래 탭 막대를 그리지 않는 화면: 쓰기·고치기(아래에 저장 띠가 붙는다)와 묶음 인쇄
const TAB_BAR_HIDDEN_PATH = /^\/admin\/rehearsal-logs\/(new|print|[^/]+\/edit)\/?$/
// 탭 칸이 너무 좁아지지 않는 최대 개수. 이보다 메뉴가 많은 계정은 ☰ 메뉴만 쓴다
const TAB_BAR_MAX_ITEMS = 5
// 탭 막대가 떠 있는 동안 body에 다는 표시 (본문 아래 여백은 globals.css가 준다)
const TAB_BAR_BODY_CLASS = 'has-admin-tabbar'

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
  // 연습일지 팀원 계정이면 '내 정보'(이름·비밀번호 고치기)를 보여준다
  const [rehearsalAccount, setRehearsalAccount] = useState<{ loginId: string; name: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        // 연습일지 계정도 극단 계정처럼 권한 키로 메뉴를 그린다 (연습일지 하나만 보인다)
        if (data.success && (data.data?.role === 'group' || data.data?.role === 'rehearsal')) {
          setIsGroupRole(true)
          setPermissions(data.data.permissions ?? [])
          setProgramType(data.data.programType ?? null)
          if (data.data.role === 'rehearsal') {
            setRehearsalAccount({ loginId: data.data.email ?? '', name: data.data.name ?? '' })
          }
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

  const isActiveItem = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href))
  // 휴대폰 상단 띠에 지금 화면 이름을 보여준다 (메뉴를 열지 않아도 어디인지 알 수 있게)
  const currentLabel = sidebarItems.find((item) => isActiveItem(item.href))?.label ?? '관리자'

  // 담당·연습일지 계정은 메뉴가 몇 개뿐이라, 휴대폰에서는 아래 탭으로 바로 오가게 한다.
  // 메뉴가 하나뿐인 계정(팀원·수강생)은 오갈 곳이 없어 그리지 않는다
  const showTabBar =
    isGroupRole &&
    groupSidebarItems.length >= 2 &&
    groupSidebarItems.length <= TAB_BAR_MAX_ITEMS &&
    !TAB_BAR_HIDDEN_PATH.test(pathname)

  // 탭 막대에 본문 끝이 가리지 않도록 body에 표시를 달아 아래 여백을 확보한다.
  // 사이드바가 화면마다 따로 그려지는 구조라, 화면별로 여백을 넣지 않고 여기서 한 번에 처리한다
  useEffect(() => {
    if (!showTabBar) return
    document.body.classList.add(TAB_BAR_BODY_CLASS)
    return () => document.body.classList.remove(TAB_BAR_BODY_CLASS)
  }, [showTabBar])

  // 휴대폰에서 메뉴가 열려 있는 동안 뒤 화면이 같이 스크롤되지 않게 잠근다
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

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
      {/* 높이 h-14는 각 화면 본문의 pt-14와 맞물려 있다 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card pl-4 pr-1.5 print:hidden">
        <Link href={homeHref} className="min-w-0 truncate font-bold text-foreground">
          {currentLabel}
        </Link>
        {/* 손가락으로 누르기 쉽게 44px 칸을 준다 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground"
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 휴대폰 아래 탭 막대 (담당·연습일지 계정) */}
      {showTabBar && (
        <nav
          aria-label="빠른 메뉴"
          className="lg:hidden fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden"
        >
          {groupSidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveItem(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate px-1">{item.short}</span>
              </Link>
            )
          })}
        </nav>
      )}

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
              const isActive = isActiveItem(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    // 휴대폰에서는 줄 간격을 넓혀 옆 메뉴를 잘못 누르지 않게 한다
                    'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-colors',
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
            {rehearsalAccount && <MyAccountButton loginId={rehearsalAccount.loginId} name={rehearsalAccount.name} />}
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
