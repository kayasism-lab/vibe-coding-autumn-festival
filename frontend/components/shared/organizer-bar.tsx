import Image from 'next/image'

interface OrganizerBarProps {
  /** 배치되는 배경에 맞춰 라벨 텍스트 색을 조정합니다. footer 등 어두운 배경은 'dark', 밝은 배경은 'light' */
  theme?: 'dark' | 'light'
  className?: string
}

// 로고 자체는 어떤 배경 위에서도 동일하게 보이도록 항상 흰색 카드에 담아 표시
export function OrganizerBar({ theme = 'dark', className = '' }: OrganizerBarProps) {
  const labelClass = theme === 'dark' ? 'text-white/50' : 'text-muted-foreground'

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium tracking-wider uppercase ${labelClass}`}>주관</span>
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
          <Image
            src="/logo/jikyeonhyeop.gif"
            alt="전국직장인연극단체협의회 로고"
            width={253}
            height={252}
            unoptimized
            className="h-8 w-8 object-contain"
          />
          <span className="whitespace-nowrap text-sm font-semibold text-slate-800">
            전국직장인연극단체협의회
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium tracking-wider uppercase ${labelClass}`}>후원</span>
        <div className="flex items-center rounded-lg bg-white px-3 py-2">
          <Image
            src="/logo/seoul-sponsor.png"
            alt="서울시 후원 로고"
            width={804}
            height={217}
            unoptimized
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  )
}
