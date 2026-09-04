'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  citizenApplicationDefaultMessages,
  citizenApplicationStatusOptions,
  type CitizenApplicationBlockedStatus,
  type CitizenApplicationStatus,
} from '@/lib/citizen-application-status'

/** 상태별 안내 문구 입력값. 비워두면 저장할 때 기본 문구가 대신 쓰인다 */
export type ProgramApplicationMessages = Record<CitizenApplicationBlockedStatus, string>

export interface ProgramApplicationValue {
  /** 시민 공개모집 대상 작품인지 여부 */
  isCitizenApplication: boolean
  applicationStatus: CitizenApplicationStatus
  applicationMessages: ProgramApplicationMessages
}

/** 문구를 입력받는 상태 목록. '신청가능'은 폼이 그대로 뜨므로 안내 문구가 없다 */
const blockedStatuses: CitizenApplicationBlockedStatus[] = ['closed', 'preparing', 'ended']

const blockedStatusLabels: Record<CitizenApplicationBlockedStatus, string> = {
  closed: '신청마감',
  preparing: '신청준비중',
  ended: '행사종료',
}

/**
 * 열린 낭독극·열린 단막극의 접수 상태와 안내 문구를 설정하는 영역.
 *
 * 상태를 '신청가능'이 아닌 값으로 두면 신청 페이지에서 안내 팝업이 뜨고,
 * 방문자가 확인을 누르면 메인화면으로 이동한다.
 */
export function ProgramApplicationFields({
  value,
  onChange,
}: {
  value: ProgramApplicationValue
  onChange: (value: ProgramApplicationValue) => void
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>시민 참여 신청 받기</Label>
          <p className="text-xs text-muted-foreground">
            열린 낭독극/열린 단막극처럼 공개모집이 필요한 프로그램에 켜주세요.
          </p>
        </div>
        <Switch
          checked={value.isCitizenApplication}
          onCheckedChange={(isCitizenApplication) => onChange({ ...value, isCitizenApplication })}
        />
      </div>

      {value.isCitizenApplication && (
        <div className="space-y-4 border-t pt-3">
          <div className="space-y-2">
            <Label>신청 상태</Label>
            <Select
              value={value.applicationStatus}
              onValueChange={(applicationStatus) =>
                onChange({ ...value, applicationStatus: applicationStatus as CitizenApplicationStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {citizenApplicationStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {citizenApplicationStatusOptions.find((option) => option.value === value.applicationStatus)?.hint}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label>상태별 안내 팝업 문구</Label>
              <p className="text-xs text-muted-foreground">
                신청 페이지에 뜨는 팝업 내용입니다. 비워두면 기본 문구가 나갑니다.
              </p>
            </div>
            {blockedStatuses.map((status) => (
              <div key={status} className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">
                  {blockedStatusLabels[status]}
                  {/* 지금 선택된 상태의 문구가 실제로 노출되는 것이라 따로 표시해준다 */}
                  {value.applicationStatus === status && (
                    <span className="ml-1 text-primary">(현재 노출)</span>
                  )}
                </Label>
                <Textarea
                  rows={2}
                  value={value.applicationMessages[status]}
                  placeholder={citizenApplicationDefaultMessages[status]}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      applicationMessages: { ...value.applicationMessages, [status]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
