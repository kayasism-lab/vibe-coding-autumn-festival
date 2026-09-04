'use client'

import { useRouter } from 'next/navigation'
import { CalendarClock, Lock, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  citizenApplicationStatusLabels,
  citizenProgramLabels,
  type CitizenApplicationBlockedStatus,
  type CitizenProgramType,
} from '@/lib/citizen-application-status'

// 상태마다 아이콘·색을 달리해 문구를 읽기 전에도 성격이 눈에 들어오게 한다
const statusIcons: Record<CitizenApplicationBlockedStatus, typeof Lock> = {
  closed: Lock,
  preparing: CalendarClock,
  ended: PartyPopper,
}

const statusStyles: Record<CitizenApplicationBlockedStatus, string> = {
  closed: 'border-muted-foreground/20 bg-muted text-muted-foreground',
  preparing: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  ended: 'border-primary/30 bg-primary/10 text-primary',
}

/**
 * 신청을 받지 않는 유형으로 들어왔을 때 띄우는 안내 팝업.
 *
 * 폼을 보여준 뒤 제출할 때 막으면 작성한 내용이 통째로 헛수고가 되므로,
 * 들어온 즉시 상태를 알리고 확인을 누르면 메인화면으로 돌려보낸다.
 * 팝업을 어떻게 닫든(확인·X·ESC·바깥 클릭) 결과는 메인화면 이동으로 같다.
 */
export function CitizenApplicationNoticeDialog({
  type,
  status,
  message,
}: {
  type: CitizenProgramType
  status: CitizenApplicationBlockedStatus
  /** 관리 화면에서 입력한 안내 문구(없으면 기본 문구가 들어온다) */
  message: string
}) {
  const router = useRouter()
  const Icon = statusIcons[status]

  const goHome = () => router.push('/')

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) goHome()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div
            className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full border ${statusStyles[status]}`}
          >
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-lg">
            {citizenProgramLabels[type]} · {citizenApplicationStatusLabels[status]}
          </DialogTitle>
          {/* 관리자가 줄바꿈을 넣어 저장할 수 있으므로 입력한 그대로 보여준다 */}
          <DialogDescription className="whitespace-pre-line text-center text-base text-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={goHome} className="w-full sm:w-auto sm:min-w-32">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
