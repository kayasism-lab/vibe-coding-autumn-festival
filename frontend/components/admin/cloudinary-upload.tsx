'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result: { event: string; info: { secure_url: string } }) => void
      ) => { open: () => void; destroy: () => void }
    }
  }
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [previewRatio, setPreviewRatio] = useState(aspectRatio || aspectRatios[0]?.value || 16 / 9)
  const widgetRef = useRef<{ open: () => void; destroy: () => void } | null>(null)

  const urls = Array.isArray(value) ? value : value ? [value] : []

  useEffect(() => {
    // Load Cloudinary script
    if (typeof window !== 'undefined' && !window.cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
      script.async = true
      script.onload = () => setIsScriptLoaded(true)
      document.body.appendChild(script)
    } else if (window.cloudinary) {
      setIsScriptLoaded(true)
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy()
      }
    }
  }, [])

  const openWidget = () => {
    if (!isScriptLoaded || !window.cloudinary) {
      console.error('Cloudinary widget not loaded')
      return
    }

    setIsLoading(true)

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        folder: folder,
        multiple: multiple,
        maxFiles: multiple ? maxFiles : 1,
        resourceType: 'image',
        cropping: true,
        croppingAspectRatio: previewRatio,
        croppingShowDimensions: true,
        showSkipCropButton: true,
        sources: ['local', 'url', 'camera'],
        styles: {
          palette: {
            window: '#1a1a1a',
            windowBorder: '#8B1538',
            tabIcon: '#D4AF37',
            menuIcons: '#D4AF37',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#D4AF37',
            action: '#8B1538',
            inactiveTabIcon: '#666666',
            error: '#F44235',
            inProgress: '#D4AF37',
            complete: '#20B832',
            sourceBg: '#2a2a2a',
          },
          fonts: {
            default: null,
          },
        },
        language: 'ko',
        text: {
          ko: {
            or: '또는',
            menu: {
              files: '파일',
              web: 'URL',
              camera: '카메라',
            },
            local: {
              browse: '파일 선택',
              dd_title_single: '여기에 파일을 드래그하세요',
              dd_title_multi: '여기에 파일들을 드래그하세요',
            },
          },
        },
      },
      (error, result) => {
        setIsLoading(false)
        if (error) {
          console.error('Upload error:', error)
          return
        }
        if (result.event === 'success') {
          const newUrl = result.info.secure_url
          if (multiple) {
            onChange([...urls, newUrl])
          } else {
            onChange(newUrl)
          }
        }
      }
    )

    widgetRef.current = widget
    widget.open()
  }

  const removeImage = (index: number) => {
    if (multiple) {
      const newUrls = urls.filter((_, i) => i !== index)
      onChange(newUrls)
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

      {/* Image Preview Grid */}
      {urls.length > 0 && (
        <div className={`grid gap-3 mb-4 ${multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'}`}>
          {urls.map((url, index) => (
            <div
              key={index}
              className="relative group w-full max-w-[220px] overflow-hidden rounded-md border border-border bg-muted sm:max-w-[260px]"
              style={{ aspectRatio: previewRatio }}
            >
              <Image
                src={url}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {(multiple || urls.length === 0) && (
        <Button
          type="button"
          variant="outline"
          onClick={openWidget}
          disabled={isLoading || !isScriptLoaded}
          className="h-28 w-full max-w-[320px] border-2 border-dashed transition-colors hover:border-primary hover:bg-primary/5 sm:h-32"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">업로드 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {urls.length > 0 ? (
                <Upload className="h-8 w-8 text-muted-foreground" />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">{placeholder}</span>
              {multiple && (
                <span className="text-xs text-muted-foreground/70">
                  최대 {maxFiles}개 업로드 가능
                </span>
              )}
            </div>
          )}
        </Button>
      )}
    </div>
  )
}
