'use client'

import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'

// 개인정보 수집·이용 동의 UI. 개인정보를 입력받는 모든 폼에서 공용으로 쓴다.
//
// 설계 근거 (개인정보 보호법):
//  - 제15조 제2항 : 목적·항목·보유기간·거부권을 반드시 알린 뒤 동의를 받아야 하므로
//                   고지 상자를 접지 않고 항상 펼쳐서 보여준다.
//  - 제22조 제1항 : 각각의 동의 사항을 구분해 각각 동의를 받아야 하므로
//                   연령 확인과 수집·이용 동의를 하나로 묶지 않고 체크박스를 나눈다.
//  - 기본값은 반드시 미체크. 미리 체크해두는 방식은 다크패턴으로 규제 대상이다.

export interface PrivacyConsentValue {
  /** 개인정보 수집·이용 동의 */
  privacyAgreed: boolean
  /** 연령 확인. 연령 확인이 필요 없는 폼에서는 항상 true로 둔다 */
  ageConfirmed: boolean
}

interface PrivacyConsentProps {
  /** 수집·이용 목적 */
  purpose: string
  /** 수집 항목 */
  items: string
  /** 보유·이용 기간 */
  retention: string
  /** 동의를 거부했을 때 받는 제한 */
  disadvantage: string
  /**
   * 연령 확인 체크박스에 표시할 문구.
   * null이면 체크박스를 렌더링하지 않는다 (예: 나이를 숫자로 직접 입력받는 폼).
   */
  ageLabel: string | null
  value: PrivacyConsentValue
  onChange: (value: PrivacyConsentValue) => void
}

/** 고지 상자의 항목 한 줄 */
function Notice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 font-medium text-foreground sm:w-28">{label}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  )
}

export function PrivacyConsent({
  purpose,
  items,
  retention,
  disadvantage,
  ageLabel,
  value,
  onChange,
}: PrivacyConsentProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-5">
      <p className="text-sm font-semibold">개인정보 수집·이용 동의</p>

      <dl className="mt-4 space-y-2 text-sm leading-relaxed">
        <Notice label="수집·이용 목적">{purpose}</Notice>
        <Notice label="수집 항목">{items}</Notice>
        <Notice label="보유·이용 기간">{retention}</Notice>
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        귀하는 개인정보 수집·이용에 동의하지 않을 권리가 있습니다. 다만 동의를 거부하시면{' '}
        {disadvantage}
      </p>

      <p className="mt-2 text-sm">
        <Link href="/privacy" target="_blank" className="font-medium text-accent underline">
          개인정보처리방침 전문 보기
        </Link>
      </p>

      <div className="mt-5 space-y-3 border-t pt-4">
        {/* 연령 확인은 동의가 아니라 자격에 대한 자기 신고라 별도 항목으로 둔다 */}
        {ageLabel && (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={value.ageConfirmed}
              onCheckedChange={(checked) =>
                onChange({ ...value, ageConfirmed: checked as boolean })
              }
              className="mt-0.5"
            />
            <span>{ageLabel}</span>
          </label>
        )}

        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <Checkbox
            checked={value.privacyAgreed}
            onCheckedChange={(checked) =>
              onChange({ ...value, privacyAgreed: checked as boolean })
            }
            className="mt-0.5"
          />
          <span>
            위 내용을 확인하였으며 개인정보 수집·이용에 동의합니다.{' '}
            <span className="font-medium text-destructive">(필수)</span>
          </span>
        </label>
      </div>
    </div>
  )
}

/** 동의 상태의 초깃값. 반드시 미체크 상태에서 시작해야 한다 */
export const emptyConsent: PrivacyConsentValue = {
  privacyAgreed: false,
  ageConfirmed: false,
}

/**
 * 제출 전 동의 검증. 통과하면 null, 아니면 사용자에게 보여줄 오류 메시지를 돌려준다.
 * @param requiresAge 연령 확인 체크박스를 쓰는 폼인지
 */
export function validateConsent(
  value: PrivacyConsentValue,
  requiresAge: boolean,
  ageMessage = '연령 확인에 체크해주세요.'
): string | null {
  if (requiresAge && !value.ageConfirmed) return ageMessage
  if (!value.privacyAgreed) return '개인정보 수집·이용에 동의해주세요.'
  return null
}
