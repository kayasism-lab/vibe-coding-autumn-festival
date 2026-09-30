'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageSquare, Trash2 } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import type { RehearsalComment } from '@/lib/rehearsal'

interface Props {
  logId: string
  /** 로그인 계정 id. 본인 댓글에만 지우기 버튼을 보여준다 */
  myId: string
  /** 관리자는 남의 댓글도 지울 수 있다 */
  canDeleteAny: boolean
}

/** '2026. 10. 3. 21:40' 형태로 짧게 보여준다 */
export function formatCommentTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 연습일지 아래 댓글 목록과 입력 칸.
 * 다른 팀 일지도 볼 수 있는 계정이면 누구나 댓글을 달 수 있고, 이름은 '내 정보'의 이름으로 표시된다.
 * 인쇄(PDF)에는 댓글 목록만 싣고 입력 칸·지우기 버튼은 뺀다. 댓글이 없으면 영역째 뺀다
 */
export function RehearsalLogComments({ logId, myId, canDeleteAny }: Props) {
  const [comments, setComments] = useState<RehearsalComment[] | null>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    adminFetch(`/api/rehearsal-logs/${logId}/comments`)
      .then(async (res) => {
        if (!res.ok) {
          setError(await getErrorMessage(res))
          setComments([])
          return
        }
        const data = await res.json()
        setComments(data.data)
      })
      .catch(() => {
        setError('댓글을 불러오지 못했습니다.')
        setComments([])
      })
  }, [logId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim()) return setError('댓글 내용을 입력해주세요.')

    setIsSaving(true)
    setError('')
    try {
      const res = await adminFetch(`/api/rehearsal-logs/${logId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) {
        setError(await getErrorMessage(res))
        return
      }
      const data = await res.json()
      setComments((prev) => [...(prev ?? []), data.data])
      setContent('')
    } catch {
      setError('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (comment: RehearsalComment) => {
    if (!confirm('이 댓글을 지우시겠습니까?')) return
    const res = await adminFetch(`/api/rehearsal-logs/${logId}/comments/${comment._id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert(await getErrorMessage(res))
      return
    }
    setComments((prev) => (prev ?? []).filter((item) => item._id !== comment._id))
  }

  const hasComments = !!comments && comments.length > 0

  return (
    <section
      className={`mt-6 rounded-xl border bg-card p-4 sm:p-6 print:mt-4 print:break-inside-auto print:rounded-none print:border-0 print:border-t print:p-0 print:pt-3 ${hasComments ? '' : 'print:hidden'}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
        <MessageSquare className="h-4 w-4" />
        댓글 {comments && comments.length > 0 && <span className="text-muted-foreground">{comments.length}</span>}
      </h2>

      {comments === null ? (
        <p className="py-4 text-sm text-muted-foreground">불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="mb-4 divide-y print:mb-0">
          {comments.map((comment) => (
            <li key={comment._id} className="break-inside-avoid py-3 print:py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-semibold">{comment.authorName || '이름 없음'}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{formatCommentTime(comment.createdAt)}</span>
                </p>
                {(comment.author === myId || canDeleteAny) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    // 휴대폰에서는 누르는 칸을 40px로 키운다 (-my-1.5: 줄 높이는 그대로 두려고)
                    className="-my-1.5 h-10 w-10 shrink-0 px-0 text-muted-foreground hover:text-destructive sm:my-0 sm:h-7 sm:w-auto sm:px-2 print:hidden"
                    onClick={() => handleDelete(comment)}
                    aria-label="댓글 지우기"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 print:hidden">
        <Textarea
          rows={3}
          className="text-base"
          placeholder="댓글을 남겨주세요"
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="h-11 w-full sm:h-9 sm:w-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            댓글 남기기
          </Button>
        </div>
      </form>
    </section>
  )
}
