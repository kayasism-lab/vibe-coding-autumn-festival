import { Drama } from 'lucide-react'

/**
 * 포스터가 아직 등록되지 않은 프로그램에 표시하는 자리 표시자.
 * 특정 이미지 파일을 코드에 박아두지 않고 CSS와 아이콘으로만 그려서,
 * 관리자가 포스터를 올리면 그대로 대체되도록 한다.
 */
export function PosterPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-foreground/90 to-foreground text-background/70 ${className}`}
    >
      {/* 무대 조명이 번지는 느낌의 은은한 광원 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,200,120,0.18),transparent_65%)]" />
      <Drama className="relative h-9 w-9 opacity-60" strokeWidth={1.25} />
      <p className="relative text-xs tracking-[0.2em] text-background/50">POSTER</p>
      <p className="relative text-sm">포스터 준비 중</p>
    </div>
  )
}
