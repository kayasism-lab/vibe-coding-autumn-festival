'use client'

import { RotateCcw } from 'lucide-react'

export type FilterOption = { value: string; label: string }

interface FilterRowProps {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  /** 사진·영상처럼 성격이 다른 1차 구분은 조금 더 크게 그린다 */
  emphasized?: boolean
}

/**
 * 이름표 + 조건 묶음 한 줄.
 * 조건이 많아도 줄바꿈으로 화면을 잡아먹지 않도록 좁은 화면에서는 가로로 밀어서 본다.
 */
function FilterRow({ label, options, value, onChange, emphasized = false }: FilterRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-xs font-medium text-muted-foreground sm:w-12 sm:text-sm">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        // 스크롤바가 보이면 칩이 잘려 보여 지저분해지므로 감춘다 (스크롤 자체는 살아 있음)
        className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isActive = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full border transition-colors ${
                emphasized ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs sm:text-sm'
              } ${
                isActive
                  ? 'border-primary bg-primary font-medium text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface GalleryFilterState {
  type: string
  category: string
  group: string
  year: string
}

interface GalleryFiltersProps {
  value: GalleryFilterState
  onChange: (value: GalleryFilterState) => void
  typeOptions: FilterOption[]
  categoryOptions: FilterOption[]
  groupOptions: FilterOption[]
  yearOptions: FilterOption[]
  resultCount: number
}

export const ALL = 'all'

export const emptyFilterState: GalleryFilterState = {
  type: ALL,
  category: ALL,
  group: ALL,
  year: ALL,
}

export function GalleryFilters({
  value,
  onChange,
  typeOptions,
  categoryOptions,
  groupOptions,
  yearOptions,
  resultCount,
}: GalleryFiltersProps) {
  const isFiltered =
    value.type !== ALL || value.category !== ALL || value.group !== ALL || value.year !== ALL

  return (
    <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
      <div className="space-y-3">
        <FilterRow
          label="종류"
          options={typeOptions}
          value={value.type}
          onChange={(type) => onChange({ ...value, type })}
          emphasized
        />
        <div className="border-t border-border/60" />
        <FilterRow
          label="구분"
          options={categoryOptions}
          value={value.category}
          onChange={(category) => onChange({ ...value, category })}
        />
        {/* 극단이 지정된 자료가 하나도 없으면 줄 자체를 그리지 않는다 */}
        {groupOptions.length > 1 && (
          <FilterRow
            label="극단"
            options={groupOptions}
            value={value.group}
            onChange={(group) => onChange({ ...value, group })}
          />
        )}
        {yearOptions.length > 1 && (
          <FilterRow
            label="연도"
            options={yearOptions}
            value={value.year}
            onChange={(year) => onChange({ ...value, year })}
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <p className="text-xs text-muted-foreground sm:text-sm">
          총 <span className="font-medium text-foreground">{resultCount}</span>개
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange(emptyFilterState)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </button>
        )}
      </div>
    </div>
  )
}
