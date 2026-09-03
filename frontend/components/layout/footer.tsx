'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Instagram, Facebook, Globe } from 'lucide-react'
import { OrganizerBar } from '@/components/shared/organizer-bar'
import { useSiteInfo } from '@/lib/site-info'

const footerLinks = {
  festival: [
    { href: '/about', label: '축제소개' },
    { href: '/about#greeting', label: '인사말' },
    { href: '/about#history', label: '연혁' },
  ],
  programs: [
    { href: '/programs', label: '전체 프로그램' },
    { href: '/schedule', label: '공연일정' },
    { href: '/tickets', label: '예매안내' },
  ],
  // 갤러리는 상단 메뉴에서 단독 항목으로 뺐지만, 푸터는 전체 사이트맵 역할이라
  // 링크를 빠뜨리지 않도록 여기에는 그대로 둔다
  community: [
    { href: '/notices', label: '공지사항' },
    { href: '/press', label: '보도 · 미디어' },
    { href: '/gallery', label: '갤러리' },
    { href: '/community', label: '자유게시판' },
    { href: '/inquiries', label: '문의하기' },
  ],
  support: [
    { href: '/sponsors', label: '후원사' },
    { href: '/contact', label: '오시는 길' },
  ],
}

export function Footer() {
  // 관리자 설정(/admin/settings)에 저장된 연락처·SNS 링크를 불러온다.
  // 값을 못 불러오거나 아직 안 채웠으면 기존에 하드코딩돼 있던 값이 그대로 보인다
  const siteInfo = useSiteInfo()

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Organizer / Sponsor */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <OrganizerBar theme="dark" />
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">가</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight">2026 가을연극축제</span>
                <span className="text-[10px] text-background/50 tracking-wider uppercase">
                  Autumn Theater Festival
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-xs">
              전국직장인연극단체협의회 주최·주관, 서울시 후원.
              놀이터, 아해, 좋은사람들, 연극패청년, 함바꿈 극단과 함께합니다.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href={siteInfo.snsLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-gradient-to-r hover:from-primary hover:to-pink-500 rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={siteInfo.snsLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-gradient-to-r hover:from-primary hover:to-pink-500 rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://cafe.daum.net/jik"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-gradient-to-r hover:from-primary hover:to-pink-500 rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="다음 카페"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Festival Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">축제안내</h3>
            <ul className="space-y-2.5">
              {footerLinks.festival.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Program Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">공연안내</h3>
            <ul className="space-y-2.5">
              {footerLinks.programs.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">커뮤니티</h3>
            <ul className="space-y-2.5">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold mb-4">연락처</h3>
            {/* 메일·전화는 안내용 정보라 링크로 걸지 않는다 (클릭·마우스오버 반응 없음) */}
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/60">
                <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{siteInfo.contactEmail}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <Phone className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{siteInfo.contactPhone}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{siteInfo.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; 2026 가을연극축제 전국직장인연극단체협의회. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <Link href="/privacy" className="hover:text-white/70">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="hover:text-white/70">
                이용약관
              </Link>
              <Link href="/admin/login" className="hover:text-white/70">
                관리자
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
