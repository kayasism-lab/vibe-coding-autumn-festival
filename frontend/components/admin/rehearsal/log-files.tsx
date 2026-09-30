'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2, Paperclip, X } from 'lucide-react'
import { formatFileSize } from '@/lib/image-resize'
import {
  ATTACHMENT_ACCEPT,
  MAX_FILES_PER_LOG,
  downloadAttachment,
  uploadAttachment,
  validateAttachment,
} from '@/lib/rehearsal-files'
import type { RehearsalFile } from '@/lib/rehearsal'

/**
 * 연습일지 첨부 파일 올리기 (쓰기·고치기 화면).
 * 파일은 백엔드 서버 디스크에 올라가고, 일지에는 주소·이름·크기만 저장된다
 */
export function LogFilesUpload({ value, onChange }: { value: RehearsalFile[]; onChange: (files: RehearsalFile[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    // 같은 파일을 다시 골라도 반응하도록 입력 칸을 비운다
    event.target.value = ''
    if (selected.length === 0) return

    if (value.length + selected.length > MAX_FILES_PER_LOG) {
      return setError(`파일은 일지 한 건에 ${MAX_FILES_PER_LOG}개까지 붙일 수 있습니다.`)
    }
    const invalid = selected.map(validateAttachment).find(Boolean)
    if (invalid) return setError(invalid)

    setError('')
    const uploaded: RehearsalFile[] = []
    try {
      for (let i = 0; i < selected.length; i++) {
        const label = selected.length > 1 ? `${i + 1}/${selected.length} ` : ''
        setProgress(`${label}올리는 중...`)
        uploaded.push(
          await uploadAttachment(selected[i], (ratio) => setProgress(`${label}올리는 중... ${Math.round(ratio * 100)}%`))
        )
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '파일을 올리지 못했습니다.')
    } finally {
      // 중간에 실패해도 그 전에 올라간 파일은 붙여 둔다
      if (uploaded.length > 0) onChange([...value, ...uploaded])
      setProgress(null)
    }
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="divide-y rounded-md border">
          {value.map((file) => (
            <li key={file.url} className="flex items-center gap-2 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="빼기"
                onClick={() => onChange(value.filter((item) => item.url !== file.url))}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input ref={inputRef} type="file" multiple accept={ATTACHMENT_ACCEPT} className="hidden" onChange={handleSelect} />
      <Button type="button" variant="outline" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
        {progress !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
        {progress ?? '파일 올리기'}
      </Button>
      <p className="text-xs text-muted-foreground">
        대본·악보·녹음 같은 파일을 붙일 수 있습니다. 한 개 10MB 이하, 최대 {MAX_FILES_PER_LOG}개
        (PDF·한글·워드·엑셀·파워포인트·압축·음성·영상). 연습일지에 로그인한 사람만 받을 수 있습니다.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/** 일지 보기 화면의 첨부 파일 목록. 인쇄·PDF에는 파일 이름과 크기만 실린다 */
export function LogFileList({ files }: { files: RehearsalFile[] }) {
  // 받는 중인 파일의 주소. 큰 파일은 몇 초 걸려 버튼에 표시해 둔다
  const [downloading, setDownloading] = useState('')
  const [error, setError] = useState('')

  const handleDownload = async (file: RehearsalFile) => {
    setDownloading(file.url)
    setError('')
    try {
      await downloadAttachment(file)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : '파일을 받지 못했습니다.')
    } finally {
      setDownloading('')
    }
  }

  return (
    <>
      <ul className="divide-y rounded-md border print:border-0">
        {files.map((file) => (
          <li key={file.url} className="flex items-center gap-2 px-3 py-2 text-sm print:px-0 print:py-1">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 break-all">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="print:hidden"
              disabled={downloading !== ''}
              onClick={() => handleDownload(file)}
            >
              {downloading === file.url ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" />
              )}
              받기
            </Button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-destructive print:hidden">{error}</p>}
    </>
  )
}
