'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, Upload, Loader2 } from 'lucide-react'
import { getConfigError, uploadImage, validateImageFile } from '@/lib/cloudinary'
import { resizeImageFile, formatFileSize } from '@/lib/image-resize'
import { UploadPreviewGrid } from './upload-preview-grid'

interface CloudinaryUploadProps {
  value?: string | string[]
  onChange: (urls: string | string[]) => void
  multiple?: boolean
  maxFiles?: number
  folder?: string
  className?: string
  aspectRatio?: number
  aspectRatios?: { label: string; value: number }[]
  placeholder?: string
}

const defaultAspectRatios = [
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:4', value: 2 / 4 },
]

/** 업로드 진행 상황. 여러 장을 올릴 때 "2/5장 · 40%"처럼 보여준다 */
interface UploadStatus {
  current: number
  total: number
  ratio: number
}

export function CloudinaryUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  folder = 'autumn_festival',
  className = '',
  aspectRatio,
  aspectRatios = defaultAspectRatios,
  placeholder = '이미지 업로드',
}: CloudinaryUploadProps) {
  const [status, setStatus] = useState<UploadStatus | null>(null)
  const [error, setError] = useState('')
  /** 크기를 줄여 올렸을 때 얼마나 가벼워졌는지 알리는 문구 */
  const [savedNotice, setSavedNotice] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewRatio, setPreviewRatio] = useState(aspectRatio || aspectRatios[0]?.value || 16 / 9)
  const inputRef = useRef<HTMLInputElement>(null)

  const urls = Array.isArray(value) ? value : value ? [value] : []
  const isUploading = status !== null

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || isUploading) return
    setError('')

    const configError = getConfigError()
    if (configError) {
      setError(configError)
      return
    }

    // 여러 장 모드가 아니면 한 장만 받고, 여러 장이어도 남은 자리만큼만 받는다
    const remaining = multiple ? maxFiles - urls.length : 1
    if (remaining <= 0) {
      setError(`이미지는 최대 ${maxFiles}개까지 올릴 수 있습니다.`)
      return
    }

    const selected = Array.from(fileList)
    const targets = selected.slice(0, remaining)
    let notice = selected.length > remaining ? `최대 ${maxFiles}개까지만 올릴 수 있어 ${targets.length}개만 업로드했습니다.` : ''

    for (const file of targets) {
      const fileError = validateImageFile(file)
      if (fileError) {
        setError(fileError)
        return
      }
    }

    // 한 장씩 순서대로 올린다. 중간에 실패해도 그때까지 성공한 것은 살린다
    const uploaded: string[] = []
    let savedBytes = 0
    try {
      for (let i = 0; i < targets.length; i++) {
        setStatus({ current: i + 1, total: targets.length, ratio: 0 })

        // 큰 사진은 올리기 전에 줄인다. 업로드도 빨라지고 보는 사람도 가볍게 받는다
        const { file: prepared, resized, originalSize } = await resizeImageFile(targets[i])
        if (resized) savedBytes += originalSize - prepared.size

        const url = await uploadImage(prepared, {
          folder,
          onProgress: (ratio) => setStatus({ current: i + 1, total: targets.length, ratio }),
        })
        uploaded.push(url)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '업로드에 실패했습니다.'
      notice = uploaded.length > 0 ? `${uploaded.length}개만 업로드했습니다. ${message}` : message
    } finally {
      setStatus(null)
    }

    if (uploaded.length > 0) {
      onChange(multiple ? [...urls, ...uploaded] : uploaded[0])
    }
    setError(notice)
    // 얼마나 가벼워졌는지 알려준다 (실패 안내가 있으면 그쪽을 우선한다)
    setSavedNotice(!notice && savedBytes > 0 ? `용량을 ${formatFileSize(savedBytes)} 줄여서 올렸습니다.` : '')
  }

  const openFilePicker = () => {
    if (isUploading) return
    // 같은 파일을 연속으로 고를 수 있도록 값을 비운 뒤 연다
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.click()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    void handleFiles(event.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    setError('')
    if (multiple) {
      onChange(urls.filter((_, i) => i !== index))
    } else {
      onChange('')
    }
  }

  return (
    <div className={className}>
      {aspectRatios.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio.label}
              type="button"
              size="sm"
              variant={Math.abs(previewRatio - ratio.value) < 0.001 ? 'default' : 'outline'}
              className="h-8 px-2 text-xs"
              onClick={() => setPreviewRatio(ratio.value)}
            >
              {ratio.label}
            </Button>
          ))}
        </div>
      )}

      <UploadPreviewGrid
        urls={urls}
        ratio={previewRatio}
        multiple={multiple}
        onRemove={removeImage}
      />

      {/* 실제 파일 선택 입력. 화면에는 안 보이지만 팝업 내부 요소라 정상 동작한다.
          한 장 모드에서 이미지를 바꿀 때도 써야 하므로 항상 그려둔다 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {multiple || urls.length === 0 ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={openFilePicker}
            disabled={isUploading}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`h-28 w-full max-w-[320px] border-2 border-dashed transition-colors hover:border-primary hover:bg-primary/5 sm:h-32 ${
              isDragging ? 'border-primary bg-primary/5' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {status.total > 1
                    ? `${status.current}/${status.total}장 업로드 중 · ${Math.round(status.ratio * 100)}%`
                    : `업로드 중 · ${Math.round(status.ratio * 100)}%`}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {urls.length > 0 ? (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">{placeholder}</span>
                <span className="text-xs text-muted-foreground/70">
                  {multiple ? `클릭 또는 드래그 · 최대 ${maxFiles}개` : '클릭 또는 드래그해서 올리기'}
                </span>
              </div>
            )}
          </Button>
        </>
      ) : (
        // 한 장만 올리는 자리에서는 미리보기가 뜨면 큰 업로드 칸이 사라진다.
        // 지우고 다시 올리지 않아도 바로 바꿀 수 있도록 교체 버튼을 남겨둔다
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFilePicker}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              업로드 중 · {Math.round(status.ratio * 100)}%
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              다른 이미지로 바꾸기
            </>
          )}
        </Button>
      )}

      {savedNotice && <p className="mt-2 text-xs text-muted-foreground">{savedNotice}</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
