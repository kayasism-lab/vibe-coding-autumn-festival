'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    label: '축제안내',
    href: '/about',
    children: [
      { href: '/about', label: '축제소개' },
      { href: '/about#greeting', label: '인사말' },
      { href: '/about#history', label: '연혁' },
      { href: '/venues', label: '공연장 안내' },
      { href: '/contact', label: '오시는 길' },
    ],
  },
  {
    label: '공연안내',
    href: '/programs',
    children: [
      { href: '/programs', label: '전체 프로그램' },
      { href: '/programs?type=play', label: '연극' },
      { href: '/programs?type=musical', label: '뮤지컬' },
      { href: '/programs?type=short_play', label: '연합단막극제' },
      { href: '/schedule', label: '공연일정' },
      { href: '/tickets', label: '예매안내' },
    ],
  },
  {
    label: '커뮤니티',
    href: '/notices',
    children: [
      { href: '/notices', label: '공지사항' },
      { href: '/notices?category=press', label: '보도자료' },
      { href: '/gallery', label: '포토갤러리' },
      { href: '/gallery?type=video', label: '영상갤러리' },
      { href: '/community', label: '커뮤니티' },
      { href: '/inquiries', label: 'Q&A' },
    ],
  },
  {
    label: '참여/후원',
    href: '/apply',
    children: [
      { href: '/apply', label: '극단 참가 신청' },
      { href: '/apply/status', label: '시민 참여 신청 조회' },
      { href: '/sponsors', label: '후원사 소개' },
      { href: '/sponsors#support', label: '후원 안내' },
    ],
  },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-transparent'
    )}>
      {/* Top Bar - 스크롤 시 숨김 */}
      <div className={cn(
        'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 overflow-hidden',
        isScrolled ? 'h-0 opacity-0' : 'h-16 opacity-100'
      )}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-amber-400 font-medium">2026 가을연극축제</span>
              <span className="text-white/60 hidden sm:inline">|</span>
              <span className="hidden items-center gap-2 text-white/70 sm:flex">
                <span>주최</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white">
                  <Image
                    src="/logo/jikyeonhyeop.gif"
                    alt="전국직장인연극단체협의회"
                    width={253}
                    height={252}
                    unoptimized
                    className="h-11 w-11 object-contain"
                  />
                </span>
                <span>전국직장인연극단체협의회</span>
              </span>
              <span className="text-white/60 hidden lg:inline">|</span>
              <span className="hidden items-center gap-2 text-white/70 lg:flex">
                <span>후원</span>
                <span className="flex h-12 items-center rounded-md bg-white px-2">
                  <Image
                    src="/logo/seoul-sponsor.png"
                    alt="서울특별시"
                    width={804}
                    height={217}
                    unoptimized
                    className="h-9 w-auto object-contain"
                  />
                </span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/login" className="text-white/60 hover:text-amber-400 transition-colors">
                로그인
              </Link>
              <Link href="/signup" className="text-white/60 hover:text-amber-400 transition-colors">
                회원가입
              </Link>
              <Link href="/contact" className="text-white/60 hover:text-amber-400 transition-colors">
                오시는 길
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={cn(
        'transition-all duration-300',
        isScrolled ? 'bg-transparent' : 'bg-black/20 backdrop-blur-sm'
      )}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                isScrolled 
                  ? 'bg-gradient-to-br from-primary to-primary/80' 
                  : 'bg-gradient-to-br from-amber-500 to-orange-500'
              )}>
                <span className="text-white font-bold text-lg">가</span>
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  'text-lg font-bold tracking-tight leading-tight transition-colors duration-300',
                  isScrolled ? 'text-foreground' : 'text-white'
                )}>
                  2026 가을연극축제
                </span>
                <span className={cn(
                  'text-[10px] tracking-wider uppercase transition-colors duration-300',
                  isScrolled ? 'text-muted-foreground' : 'text-white/60'
                )}>
                  Autumn Theater Festival
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 px-5 py-6 text-sm font-medium transition-colors',
                      isScrolled
                        ? activeDropdown === item.label
                          ? 'text-primary'
                          : 'text-foreground hover:text-primary'
                        : activeDropdown === item.label
                          ? 'text-amber-400'
                          : 'text-white/90 hover:text-amber-400'
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn(
                      'h-3 w-3 transition-transform',
                      activeDropdown === item.label && 'rotate-180'
                    )} />
                  </Link>

                  {/* Dropdown */}
                  <div
                    className={cn(
                      'absolute top-full left-0 w-48 bg-white border border-border rounded-lg shadow-xl transition-all duration-200',
                      activeDropdown === item.label
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                    )}
                  >
                    <ul className="py-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Button 
                asChild 
                size="default" 
                className={cn(
                  'rounded-full px-6 transition-all duration-300',
                  isScrolled 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                )}
              >
                <Link href="/tickets">예매하기</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={cn(
                'lg:hidden p-2 transition-colors',
                isScrolled ? 'text-foreground' : 'text-white'
              )}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="메뉴 열기"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'lg:hidden fixed inset-x-0 top-[4rem] bottom-0 bg-white z-50 overflow-y-auto transition-all duration-300 ease-in-out',
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <nav className="px-4 py-6">
          {navItems.map((item) => (
            <div key={item.href} className="border-b border-border">
              <div className="py-3">
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
              </div>
              <ul className="pb-4 pl-4">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className="block py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-6">
            <Button asChild className="w-full" size="lg">
              <Link href="/tickets" onClick={() => setIsMenuOpen(false)}>
                예매하기
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
