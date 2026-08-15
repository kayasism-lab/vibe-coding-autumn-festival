'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Building2, Award, Handshake } from 'lucide-react'

type Sponsor = {
  _id: string
  name: string
  logoUrl: string
  websiteUrl?: string
  tier: 'main' | 'gold' | 'silver' | 'partner'
}

const tierLabels = {
  main: '메인 스폰서',
  gold: '골드 스폰서',
  silver: '실버 스폰서',
  partner: '파트너',
}

const sponsorBenefits = [
  { icon: Award, title: '브랜드 노출', description: '축제 홍보물, 웹사이트, SNS 등에 후원사 로고 노출' },
  { icon: Building2, title: 'VIP 좌석', description: '주요 공연 VIP 좌석 및 리셉션 초대권 제공' },
  { icon: Heart, title: '문화 공헌', description: '지역 문화예술 발전에 기여하는 사회공헌 활동' },
  { icon: Handshake, title: '네트워킹', description: '문화예술계 인사들과의 네트워킹 기회 제공' },
]

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])

  useEffect(() => {
    fetch('/api/sponsors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSponsors(data.data)
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-[8.25rem]">
        <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">후원사 안내</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">가을연극축제를 함께 만들어가는 소중한 후원사들을 소개합니다.</p>
          </div>
        </section>
        {(['main', 'gold', 'silver', 'partner'] as const).map((tier) => {
          const tierSponsors = sponsors.filter((sponsor) => sponsor.tier === tier)
          if (tierSponsors.length === 0) return null
          return (
            <section key={tier} className="py-16 border-b border-border">
              <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold">{tierLabels[tier]}</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {tierSponsors.map((sponsor) => (
                    <a key={sponsor._id} href={sponsor.websiteUrl || '#'} target={sponsor.websiteUrl ? '_blank' : undefined} rel="noopener noreferrer" className="w-44 h-20 bg-card rounded-xl border p-3 flex items-center justify-center">
                      <img src={sponsor.logoUrl} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )
        })}
        <section id="support" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">후원 안내</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">가을연극축제와 함께 지역 문화예술 발전에 동참해 주세요.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {sponsorBenefits.map((benefit) => {
                const Icon = benefit.icon
                return <Card key={benefit.title} className="text-center"><CardContent className="pt-6"><div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-7 w-7 text-primary" /></div><h3 className="font-semibold mb-2">{benefit.title}</h3><p className="text-sm text-muted-foreground">{benefit.description}</p></CardContent></Card>
              })}
            </div>
            <div className="text-center"><Button asChild size="lg"><Link href="/contact">후원 문의하기</Link></Button></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
