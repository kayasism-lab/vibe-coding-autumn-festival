'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatProgramPeriod } from '@/lib/format-date'
import type { UpcomingShow, UpcomingShowKind } from '@/types/index'

type ProgramOption = { _id: string; title: string }

/** 셀렉트에서 "등록 안 함"을 고를 때 쓰는 값. 빈 문자열은 Select가 허용하지 않는다 */
const NONE = 'none'

interface UpcomingShowFieldsProps {
  value?: UpcomingShow
  onChange: (show: UpcomingShow | undefined) => void
}

/**
 * 참여 극단 관리에서 "앞으로의 공연정보"를 입력하는 부분.
 *
 * 가을연극축제를 고르면 등록된 프로그램 중에서 선택하고 공연일은 회차에서 자동으로
 * 가져와 보여준다(저장하지 않음 — 회차가 바뀌면 표시도 따라가야 하므로).
 * 일반공연은 축제 일정에 없으므로 공연일과 예약 주소를 직접 받는다.
 */
export function UpcomingShowFields({ value, onChange }: UpcomingShowFieldsProps) {
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [festivalDates, setFestivalDates] = useState<string[]>([])

  const kind = value?.kind
  const programId = value?.programId

  useEffect(() => {
    fetch('/api/programs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrograms(data.data)
      })
      .catch(() => {
        // 목록을 못 받으면 선택지가 비어 보일 뿐, 다른 입력은 그대로 쓸 수 있다
      })
  }, [])

  // 고른 프로그램의 회차를 불러와 공연일을 미리 보여준다 (관리자 확인용)
  useEffect(() => {
    if (kind !== 'festival' || !programId) {
      setFestivalDates([])
      return
    }
    let cancelled = false
    fetch(`/api/schedules?programId=${programId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return
        setFestivalDates((data.data as Array<{ date: string }>).map((item) => item.date))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [kind, programId])

  const handleKindChange = (next: string) => {
    if (next === NONE) {
      onChange(undefined)
      return
    }
    // 종류를 바꾸면 이전 종류에서 쓰던 값은 버린다 (축제 선택인데 URL이 남는 것을 막음)
    onChange({ kind: next as UpcomingShowKind })
  }

  const festivalPeriod = formatProgramPeriod(festivalDates)

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-2">
        <Label>앞으로의 공연정보</Label>
        <Select value={kind ?? NONE} onValueChange={handleKindChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>등록 안 함</SelectItem>
            <SelectItem value="festival">가을연극축제</SelectItem>
            <SelectItem value="external">일반공연</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          등록하면 홈 화면 극단 목록과 극단 소개 팝업에 공연정보가 표시됩니다.
        </p>
      </div>

      {kind === 'festival' && (
        <>
          <div className="space-y-2">
            <Label>공연 선택</Label>
            <Select
              value={programId ?? ''}
              onValueChange={(next) => onChange({ kind: 'festival', programId: next })}
            >
              <SelectTrigger>
                <SelectValue placeholder="축제 공연을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program._id} value={program._id}>
                    {program.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>공연일</Label>
            {/* 회차에서 자동으로 가져오므로 직접 고칠 수 없다 */}
            <Input
              readOnly
              value={
                !programId
                  ? ''
                  : festivalPeriod ?? '등록된 회차가 없습니다 (일정 관리에서 회차를 먼저 등록하세요)'
              }
              placeholder="공연을 선택하면 회차에서 자동으로 표시됩니다"
              className="bg-muted"
            />
          </div>
        </>
      )}

      {kind === 'external' && (
        <>
          <div className="space-y-2">
            <Label>공연일</Label>
            <Input
              type="date"
              value={value?.date?.slice(0, 10) ?? ''}
              onChange={(e) => onChange({ ...value, kind: 'external', date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>예약 URL</Label>
            <Input
              value={value?.url ?? ''}
              onChange={(e) => onChange({ ...value, kind: 'external', url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </>
      )}
    </div>
  )
}
