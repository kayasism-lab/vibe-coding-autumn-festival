import { cn } from '@/lib/utils'

/**
 * 관리 화면의 긴 입력 팝업을 휴대폰에서 '전체 화면'으로 바꾸는 부품 묶음.
 *
 * 공용 Dialog(components/ui/dialog.tsx)는 다른 관리 화면이 함께 쓰므로 건드리지 않고,
 * 필요한 팝업의 DialogContent에 MOBILE_SHEET를 덧붙여 쓴다.
 *
 * - 휴대폰(sm 미만): 화면 전체를 덮는다. 가운데 뜬 작은 창은 긴 폼을 쓰기에 좁다
 * - 그보다 넓은 화면: 지금처럼 가운데 창. 폭은 팝업마다 `sm:max-w-*`로 따로 준다
 *   (공용 Dialog 기본값에 `sm:max-w-lg`가 있어, `max-w-*`만 주면 512px에 갇힌다)
 * - 안쪽은 머리글 / 스크롤되는 본문 / 아래 버튼 3단이다. 저장 버튼이 늘 보이도록
 *   창 전체가 아니라 본문만 스크롤시킨다
 *
 * 휴대폰용 값은 `max-sm:` 변형으로 덮는다. 변형이 붙은 클래스는 기본 클래스보다 뒤에
 * 만들어져 우선하므로, 공용 Dialog의 가운데 정렬(top-50%·translate)을 이길 수 있다
 */
export const MOBILE_SHEET = cn(
  'flex flex-col gap-0 overflow-hidden p-0',
  'max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0',
  'max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0'
)

/** 팝업 머리글. 오른쪽 위 닫기(X) 버튼과 겹치지 않게 오른쪽을 비워 둔다 */
export function SheetHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('shrink-0 space-y-1 border-b px-4 py-3.5 pr-12 text-left sm:px-6', className)}>
      {children}
    </div>
  )
}

/** 스크롤되는 본문. min-h-0이 없으면 내용만큼 부풀어 아래 버튼을 화면 밖으로 민다 */
export function SheetBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6', className)}>
      {children}
    </div>
  )
}

/**
 * 아래에 붙어 있는 버튼 줄. 휴대폰에서는 버튼을 같은 폭으로 크게 늘린다.
 * 저장 실패 문구를 버튼 바로 위에 두어, 긴 폼을 끝까지 내리지 않아도 보이게 한다
 */
export function SheetFooter({
  error,
  className,
  children,
}: {
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    // 아이폰 홈 막대에 버튼이 가리지 않게 아래 여백을 더한다
    <div className={cn('shrink-0 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6', className)}>
      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2 sm:justify-end max-sm:[&>button]:h-11 max-sm:[&>button]:flex-1 max-sm:[&>button]:text-base">
        {children}
      </div>
    </div>
  )
}
