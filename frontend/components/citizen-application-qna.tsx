'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export interface QnaEntry {
  author: 'admin' | 'applicant'
  message: string
  createdAt: string
}

export function CitizenApplicationQna({
  qna = [],
  canReply,
  replyingAs,
  onSubmit,
}: {
  qna?: QnaEntry[]
  canReply: boolean
  replyingAs: 'admin' | 'applicant'
  onSubmit: (message: string) => Promise<string | void>
}) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!message.trim()) return
    setIsSending(true)
    setError('')
    const errorMessage = await onSubmit(message.trim())
    if (errorMessage) {
      setError(errorMessage)
    } else {
      setMessage('')
    }
    setIsSending(false)
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium text-foreground">문의·답변 (Q&A)</p>
      {qna.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 등록된 문의가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {qna.map((entry, idx) => (
            <li
              key={idx}
              className={`rounded-lg p-3 text-sm ${entry.author === 'admin' ? 'bg-primary/5' : 'bg-muted/50'}`}
            >
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {entry.author === 'admin' ? '관리자' : '신청자'} · {new Date(entry.createdAt).toLocaleString('ko-KR')}
              </p>
              <p className="whitespace-pre-wrap">{entry.message}</p>
            </li>
          ))}
        </ul>
      )}
      {canReply && (
        <div className="space-y-2 border-t pt-3">
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={replyingAs === 'admin' ? '신청자에게 남길 문의를 입력하세요.' : '관리자에게 남길 답변을 입력하세요.'}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" size="sm" onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            등록
          </Button>
        </div>
      )}
    </div>
  )
}
