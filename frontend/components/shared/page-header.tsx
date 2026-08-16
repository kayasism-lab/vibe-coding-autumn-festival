import Image from 'next/image'

// 페이지 성격별 히어로 이미지 프리셋
// 각 페이지에서 파일 경로를 직접 쓰지 않고 의미 있는 키로 고르게 해 일관성을 유지한다
export const pageHeroImages = {
  chair: {
    src: '/images/stage-chair.png',
    alt: '스포트라이트 아래 놓인 빈 의자',
  },
  actor: {
    src: '/images/stage-actor-silhouette.png',
    alt: '무대 위에서 두 팔을 벌린 배우의 실루엣',
  },
  stage: {
    src: '/images/stage-empty-spotlights.png',
    alt: '조명이 켜진 빈 공연장 무대',
  },
  bulbs: {
    src: '/images/stage-bulbs.png',
    alt: '무대 위에 매달린 전구들',
  },
} as const

export type PageHeroKey = keyof typeof pageHeroImages

interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
  /** 배경 히어로 이미지 (생략 시 기존 단색 헤더) */
  hero?: PageHeroKey
}

export function PageHeader({ title, description, subtitle, hero }: PageHeaderProps) {
  const heroImage = hero ? pageHeroImages[hero] : null

  return (
    <div className="relative overflow-hidden bg-foreground py-16 text-background lg:py-24">
      {heroImage && (
        <div className="absolute inset-0">
          <Image src={heroImage.src} alt={heroImage.alt} fill priority className="object-cover" />
          {/* 텍스트 가독성 확보용 이중 오버레이 (좌→우, 하→상) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {subtitle && (
          <p className="eyebrow mb-3 text-accent">{subtitle}</p>
        )}
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-background/75">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
