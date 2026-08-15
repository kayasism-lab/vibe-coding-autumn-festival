'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ArrowRight, Calendar, MapPin, Sparkles, Users, Award, ExternalLink, Play, Ticket, Instagram, Facebook, Youtube, Globe, BookOpen } from 'lucide-react'

// 참여 극단 정보 타입
interface TheaterGroup {
  _id?: string
  name: string
  color: string
  bgGradient: string
  founded?: string
  members?: string
  description: string
  highlights?: string[]
  imageUrl?: string
  videoUrl?: string
  photos?: string[]
  socialLinks?: {
    website?: string
    instagram?: string
    facebook?: string
    youtube?: string
    blog?: string
  }
}

// 기본 극단 데이터 (DB에서 불러오기 전 또는 fallback)
const defaultTheaterGroups: TheaterGroup[] = [
  { 
    name: '극단 놀이터', 
    color: 'bg-amber-500',
    bgGradient: 'from-amber-600 to-orange-500',
    founded: '2009년',
    description: '극단 [놀이\'터\']는 직장생활을 하며 연극의 꿈을 찾아가는 직장인 극단입니다. 평범한 일상에서 벗어나, 숨겨 두었던 자신만의 에너지와 열정을 쏟아낼 수 있는 곳으로 만 20세 이상이면 누구나 함께 할 수 있습니다.',
    highlights: ['직장인들의 연극 꿈을 실현하는 공간', '만 20세 이상 누구나 참여 가능', '뜨거운 열정으로 채우는 무대'],
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%EB%86%80%EC%9D%B4%ED%84%B0%20%EC%86%8C%EA%B0%9C-WAYkzpntSLql87LtSAL5nCsif2ccot.jpg',
    socialLinks: { website: 'https://cafe.daum.net/noliter2009', instagram: 'https://www.instagram.com/noliter2009/' },
  },
  {
    name: '극단 아해',
    color: 'bg-rose-600',
    bgGradient: 'from-rose-700 to-pink-600',
    founded: '1978년',
    description: '극단 [아해]는 서울 성북구를 기반으로 활동하고 있으며, 1978년 창단 이후 48년을 이어온 대한민국 대표 직장인 극단입니다.',
    highlights: ['1978년 창단, 48년 역사', '80회 이상의 정기 공연', '각종 연극제 30회 이상 수상'],
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%EC%95%84%ED%95%B4%20%EC%86%8C%EA%B0%9C-4bqamjYlGrcfzfenVmsbmVlNejeyAY.jpg',
    socialLinks: { website: 'https://cafe.daum.net/ahhai', instagram: 'https://www.instagram.com/ahhai1978/' },
  },
  {
    name: '극단 좋은사람들',
    color: 'bg-violet-600',
    bgGradient: 'from-violet-700 to-purple-600',
    founded: '2005년',
    description: '2005년에 창단한 극단 [좋은사람들]은 다양한 직업을 가진 시민들이 모여 연극을 통해 삶을 풍요롭게 가꾸어 가고자 만든 직장인 중심의 연극 공동체입니다.',
    highlights: ['다양한 직업의 시민들이 모인 연극 공동체', '퇴근 후 창작 활동', '시민 참여형 문화 예술 추구'],
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%EC%A2%8B%EC%9D%80%EC%82%AC%EB%9E%8C%EB%93%A4%20%EC%86%8C%EA%B0%9C-UxeuOA8ILl3yCznbOdHlOZa9WB6w0X.jpg',
    socialLinks: { website: 'https://cafe.daum.net/qodntmxoq', instagram: 'https://www.instagram.com/goodpeople2005528/' },
  },
  {
    name: '극단 연극패청년',
    color: 'bg-blue-600',
    bgGradient: 'from-blue-700 to-indigo-600',
    founded: '1990년',
    description: '영등포구청을 기반으로 활동하는 극단 [연극패청년]은 1990년 창단 이래 30년 넘게 무대를 지켜온 비영리 직장인 극단입니다.',
    highlights: ['1990년 창단, 30년 이상의 역사', '다수 연극제 수상 경력', '자체 연습실 및 제작 시스템 보유'],
    imageUrl: 'https://res.cloudinary.com/dcyrw85bi/image/upload/v1786770865/xpuyysil1m1qn7jkmtnd.png',
    socialLinks: { website: 'https://cafe.daum.net/now102', instagram: 'https://www.instagram.com/play_youth/' },
  },
  {
    name: '극단 함바꿈',
    color: 'bg-teal-600',
    bgGradient: 'from-teal-700 to-cyan-600',
    description: '극단 소개가 준비 중입니다. 곧 업데이트 예정입니다.',
    socialLinks: { website: 'https://cafe.daum.net/playhbg', instagram: 'https://www.instagram.com/playhbg/' },
    highlights: ['준비 중'],
  },
]

export function HeroSection() {
  const [theaterGroups, setTheaterGroups] = useState<TheaterGroup[]>(defaultTheaterGroups)
  const [selectedGroup, setSelectedGroup] = useState<TheaterGroup | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    // DB에서 극단 데이터 가져오기
    fetch('/api/theater-groups')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.data?.length > 0) {
          setTheaterGroups(data.data)
        }
      })
      .catch(() => {
        // 에러 시 기본 데이터 사용
      })
  }, [])

  const handleGroupClick = (group: TheaterGroup) => {
    setSelectedGroup(group)
    setIsDialogOpen(true)
  }

  // SNS 아이콘 컴포넌트
  const SocialLinks = ({ links }: { links?: TheaterGroup['socialLinks'] }) => {
    if (!links) return null
    
    const hasLinks = links.website || links.instagram || links.facebook || links.youtube || links.blog
    if (!hasLinks) return null

    return (
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground mr-2">SNS</span>
        {links.website && (
          <a href={links.website} target="_blank" rel="noopener noreferrer" 
            className="w-9 h-9 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors"
            title="홈페이지">
            <Globe className="h-4 w-4" />
          </a>
        )}
        {links.instagram && (
          <a href={links.instagram} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 bg-secondary hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white rounded-full flex items-center justify-center transition-all"
            title="Instagram">
            <Instagram className="h-4 w-4" />
          </a>
        )}
        {links.facebook && (
          <a href={links.facebook} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 bg-secondary hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
            title="Facebook">
            <Facebook className="h-4 w-4" />
          </a>
        )}
        {links.youtube && (
          <a href={links.youtube} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 bg-secondary hover:bg-red-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
            title="YouTube">
            <Youtube className="h-4 w-4" />
          </a>
        )}
        {links.blog && (
          <a href={links.blog} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 bg-secondary hover:bg-green-500 hover:text-white rounded-full flex items-center justify-center transition-colors"
            title="블로그">
            <BookOpen className="h-4 w-4" />
          </a>
        )}
      </div>
    )
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="연극 무대 배경"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay - 중후한 느낌 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gold accent lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left - Main Content (3 cols) */}
            <div className={`lg:col-span-3 text-center lg:text-left transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Host Badge - 모바일에서 상단 헤더에 가려지지 않도록 약간 아래로 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-6 mt-4 sm:mt-0">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white/90">전국직장인연극단체협의회 주최</span>
                <a
                  href="https://www.instagram.com/jikplay1997"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="전국직장인연극단체협의회 Instagram"
                  className="text-white/70 hover:text-amber-400 transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Main Title */}
              <p className="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-4">
                Autumn Theater Festival 2026
              </p>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
                <span className="block">2026</span>
                <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  가을연극축제
                </span>
                <span className="flex items-center justify-center lg:justify-start gap-2 mt-2">
                  <Image
                    src="/images/hero-subtitle-worker.png"
                    alt=""
                    width={408}
                    height={400}
                    className="h-[72px] w-auto sm:h-20 lg:h-24"
                  />
                  <span className="text-lg sm:text-xl lg:text-2xl font-medium text-white/70">
                    직장인들의 <span className="font-bold text-amber-400">이중생활</span>
                  </span>
                  <Image
                    src="/images/hero-subtitle-actor.png"
                    alt=""
                    width={413}
                    height={400}
                    className="h-[72px] w-auto sm:h-20 lg:h-24"
                  />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                낮에는 직장인, 밤에는 배우!<br className="hidden sm:block" />
                관람에서 참여로 이어지는 축제, 시민 누구나 함께할 수 있습니다.
              </p>

              {/* Event Info Tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span className="text-white/90 text-sm">2026.9.19 ~ 11.29</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span className="text-white/90 text-sm">서울시 소재 공연장 4곳</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Ticket className="h-4 w-4 text-amber-400" />
                  <span className="text-white/90 text-sm">전석 무료</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span className="text-white/90 text-sm">{theaterGroups.length}개 극단 참여</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-8 shadow-lg shadow-amber-500/30 border-0"
                >
                  <Link href="/programs">
                    <Play className="mr-2 h-4 w-4" />
                    프로그램 보기
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-8 shadow-lg shadow-amber-500/30 border-0"
                >
                  <Link href="/tickets">
                    <Ticket className="mr-2 h-4 w-4" />
                    무료 관람 안내
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right - Info Cards (2 cols) */}
            <div className={`lg:col-span-2 space-y-6 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Stats Cards - 클릭하면 공연 프로그램의 해당 유형 필터로 이동 */}
              <div className="grid grid-cols-3 gap-3">
                <Link
                  href="/programs?type=play"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-transparent hover:border-amber-400/30 hover:bg-white/15 transition-all duration-300 group cursor-pointer"
                >
                  <p className="text-3xl font-bold text-amber-400 group-hover:scale-110 transition-transform">2</p>
                  <p className="text-xs text-white/70 mt-1 group-hover:text-white transition-colors">연극</p>
                </Link>
                <Link
                  href="/programs?type=reading"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-transparent hover:border-amber-400/30 hover:bg-white/15 transition-all duration-300 group cursor-pointer"
                >
                  <p className="text-3xl font-bold text-amber-400 group-hover:scale-110 transition-transform">1</p>
                  <p className="text-xs text-white/70 mt-1 group-hover:text-white transition-colors">열린 낭독극</p>
                </Link>
                <Link
                  href="/programs?type=short_play"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-transparent hover:border-amber-400/30 hover:bg-white/15 transition-all duration-300 group cursor-pointer"
                >
                  <p className="text-3xl font-bold text-amber-400 group-hover:scale-110 transition-transform">1</p>
                  <p className="text-xs text-white/70 mt-1 group-hover:text-white transition-colors">열린 단막극</p>
                </Link>
              </div>

              {/* Participating Theater Groups */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  참여 극단
                  <span className="text-xs text-white/50 font-normal ml-auto">클릭하여 소개 보기</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {theaterGroups.map((group) => (
                    <button
                      key={group.name}
                      onClick={() => handleGroupClick(group)}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/15 rounded-xl transition-all duration-300 cursor-pointer group text-left border border-transparent hover:border-amber-400/30"
                    >
                      <div className={`w-2.5 h-2.5 ${group.color} rounded-full group-hover:scale-125 transition-transform shadow-lg`} />
                      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                        {group.name.replace('극단 ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex gap-3">
                <Link 
                  href="/schedule" 
                  className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md rounded-xl p-4 text-center border border-amber-500/30 transition-all group"
                >
                  <Calendar className="h-5 w-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">공연 일정</span>
                </Link>
                <Link 
                  href="/notices" 
                  className="flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/10 transition-all group"
                >
                  <Sparkles className="h-5 w-5 text-white/70 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white/80">공지사항</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-wider uppercase">Scroll</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </div>

      {/* Theater Group Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
          {selectedGroup && (
            <div className="flex flex-col">
              {/* 이미지 영역 */}
              {selectedGroup.imageUrl ? (
                <div className="w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-t-lg relative">
                  <img 
                    src={selectedGroup.imageUrl} 
                    alt={`${selectedGroup.name} 단체 사진`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedGroup.name}</h2>
                    {selectedGroup.founded && (
                      <p className="text-amber-400 text-sm mt-1">창단 {selectedGroup.founded}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`w-full h-48 bg-gradient-to-r ${selectedGroup.bgGradient} rounded-t-lg flex items-center justify-center`}>
                  <span className="text-white text-3xl font-bold">{selectedGroup.name}</span>
                </div>
              )}
              
              {/* 콘텐츠 영역 */}
              <div className="p-6 space-y-4">
                {!selectedGroup.imageUrl && (
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-bold">{selectedGroup.name}</DialogTitle>
                    
                    {/* 기본 정보 */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {selectedGroup.founded && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                          <Award className="h-4 w-4" />
                          <span>창단 {selectedGroup.founded}</span>
                        </div>
                      )}
                      {selectedGroup.members && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                          <Users className="h-4 w-4" />
                          <span>단원 {selectedGroup.members}</span>
                        </div>
                      )}
                    </div>
                  </DialogHeader>
                )}
                
                <DialogDescription asChild>
                  <div className="space-y-4">
                    {/* 소개 */}
                    <p className="text-foreground/80 leading-relaxed text-base">
                      {selectedGroup.description}
                    </p>

                    {/* 주요 활동 */}
                    {selectedGroup.highlights && selectedGroup.highlights[0] !== '준비 중' && (
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold mb-3 text-foreground">주요 활동</h4>
                        <ul className="space-y-2">
                          {selectedGroup.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground/70">
                              <span className={`w-2 h-2 ${selectedGroup.color} rounded-full mt-1.5 flex-shrink-0`} />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 공연 준비 영상 */}
                    {selectedGroup.videoUrl && (
                      <a
                        href={selectedGroup.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-secondary/50 hover:bg-secondary p-4 text-sm font-medium text-foreground transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        공연 준비 영상 보기
                      </a>
                    )}

                    {/* 공연 준비 사진 */}
                    {selectedGroup.photos && selectedGroup.photos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-foreground">공연 준비 사진</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedGroup.photos.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden rounded-lg bg-muted">
                              <img src={url} alt={`${selectedGroup.name} 공연 준비 사진`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SNS 링크 */}
                    <SocialLinks links={selectedGroup.socialLinks} />
                  </div>
                </DialogDescription>
                
                {/* 닫기 버튼 - 하단 우측 */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button 
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-full px-8"
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
