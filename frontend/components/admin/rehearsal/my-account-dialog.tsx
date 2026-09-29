'use client'

import { useState } from 'react'
import { AccountSetupForm } from '@/components/admin/rehearsal/account-setup-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserRound } from 'lucide-react'

/** 연습일지 팀원 계정의 '내 정보' 버튼: 이름·비밀번호를 언제든 고친다 */
export function MyAccountButton({ loginId, name }: { loginId: string; name: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setIsOpen(true)}>
        <UserRound className="mr-2 h-4 w-4" />
        내 정보 ({name})
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>내 정보</DialogTitle>
            <DialogDescription>아이디 {loginId}</DialogDescription>
          </DialogHeader>
          {/* 저장하면 새로고침해 사이드바·일지 작성자 이름에 바로 반영한다 */}
          <AccountSetupForm
            isFirstLogin={false}
            loginId={loginId}
            currentName={name}
            onDone={() => window.location.reload()}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
