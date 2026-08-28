'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Move, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CENTER_FOCUS,
  clampFocus,
  getCoverOverflow,
  toObjectPosition,
  type ImageFocus,
} from '@/lib/image-focus'

/**
 * 프로필 사진을 맞출 때처럼, 정해진 크기의 틀 안에서 이미지를 끌어 보일 부분을 정한다.
 *
 * 이미지를 잘라 새로 만들지 않고 "중심점"만 저장한다. 원본은 그대로 남으므로
 * 나중에 다른 비율의 자리에 써도 되고, 몇 번을 다시 맞춰도 화질이 나빠지지 않는다.
 */
export function ImageFocusPicker({
  src,
  ratio,
  value,
  onChange,
  hint,
}: {
  src: string
  /** 미리보기 틀의 가로:세로 비율. 실제로 이미지가 놓일 자리와 같게 준다 */
  ratio: number
  value?: ImageFocus | null
  onChange: (focus: ImageFocus) => void
  hint?: string
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  // 어느 이미지를 잰 값인지 함께 담는다. 이미지를 바꾸면 이전 크기를 쓰지 않기 위해서다
  const [measured, setMeasured] = useState<{ src: string; width: number; height: number } | null>(null)
  /** 미리보기 틀의 실제 크기. 창 크기를 바꾸면 잘리는 양도 달라지므로 계속 지켜본다 */
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  /** 드래그를 시작한 지점과 그때의 중심점. 이동량을 여기서부터 잰다 */
  const dragRef = useRef<{ pointerX: number; pointerY: number; focus: ImageFocus } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const focus = value ?? CENTER_FOCUS

  /**
   * 이미지의 원본 크기를 잰다.
   *
   * onLoad만 쓰면 브라우저 캐시에 있는 이미지는 그리기 전에 이미 로드가 끝나 있어
   * 이벤트가 오지 않는 경우가 있다. ref로도 한 번 재서 두 경로를 모두 막는다.
   * 같은 값이면 이전 객체를 그대로 돌려줘 다시 그리는 일이 반복되지 않게 한다.
   */
  const measure = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image?.complete || !image.naturalWidth) return
      const size = { src, width: image.naturalWidth, height: image.naturalHeight }
      setMeasured((prev) =>
        prev && prev.src === size.src && prev.width === size.width && prev.height === size.height
          ? prev
          : size
      )
    },
    [src]
  )

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setFrameSize({ width, height })
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  // 이미지를 막 바꾼 직후에는 아직 예전 이미지의 크기가 남아 있으므로 걸러낸다
  const natural = measured?.src === src ? measured : null
  const overflow = natural ? getCoverOverflow(natural, frameSize) : { x: 0, y: 0 }
  const canMoveX = overflow.x > 1
  const canMoveY = overflow.y > 1
  const canMove = canMoveX || canMoveY

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!canMove) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, focus }
    setIsDragging(true)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag || !natural) return

    const { x: overflowX, y: overflowY } = getCoverOverflow(natural, frameSize)

    // 이미지를 손으로 끄는 느낌이 되도록, 오른쪽으로 끌면 이미지의 왼쪽이 보이게 한다.
    // 잘리는 양(overflow)이 클수록 같은 거리를 끌어도 조금만 움직인다
    const nextX = overflowX > 0 ? drag.focus.x - ((event.clientX - drag.pointerX) / overflowX) * 100 : drag.focus.x
    const nextY = overflowY > 0 ? drag.focus.y - ((event.clientY - drag.pointerY) / overflowY) * 100 : drag.focus.y

    onChange(clampFocus({ x: nextX, y: nextY }))
  }

  const endDrag = () => {
    dragRef.current = null
    setIsDragging(false)
  }

  return (
    <div>
      <div
        ref={frameRef}
        style={{ aspectRatio: String(ratio) }}
        // touch-none이 없으면 휴대폰에서 손가락을 끌 때 화면 스크롤로 먹혀 위치를 못 옮긴다.
        // 조정할 수 없는 이미지에서는 평소처럼 스크롤되도록 둔다
        className={`relative w-full max-w-[420px] select-none overflow-hidden rounded-lg border bg-muted ${
          canMove ? (isDragging ? 'cursor-grabbing touch-none' : 'cursor-grab touch-none') : 'cursor-default'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          ref={measure}
          src={src}
          alt="노출 위치 미리보기"
          draggable={false}
          onLoad={(event) => measure(event.currentTarget)}
          style={{ objectPosition: toObjectPosition(focus) }}
          className="pointer-events-none h-full w-full object-cover"
        />

        {canMove && !isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
              <Move className="h-3.5 w-3.5" />
              드래그해서 위치 조정
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(CENTER_FOCUS)}
          disabled={!canMove}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          가운데로
        </Button>
        <p className="text-xs text-muted-foreground">
          {!natural
            ? '이미지를 불러오는 중입니다.'
            : canMove
              ? (hint ?? '이 틀에 보일 부분을 정합니다. 원본 이미지는 그대로 보관됩니다.')
              : '이미지 비율이 이 틀과 같아 잘리는 부분이 없습니다.'}
        </p>
      </div>
    </div>
  )
}
