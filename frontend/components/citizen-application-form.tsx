'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import { Field, RadioOption, YesNoField } from '@/components/citizen-application-fields'
import {
  PrivacyConsent,
  emptyConsent,
  validateConsent,
  type PrivacyConsentValue,
} from '@/components/shared/privacy-consent'
import { formatPhoneInput } from '@/lib/phone'
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH, validatePassword } from '@/lib/password-policy'

// 시민참여 행사(낭독극·단막극)는 만 20세 이상만 신청할 수 있다.
const MIN_AGE = 20

export type CitizenProgramType = 'reading' | 'short_play'

interface FormState {
  programType: CitizenProgramType
  name: string
  phone: string
  email: string
  residence: string
  age: string
  gender: 'male' | 'female' | ''
  practiceAvailable: boolean | ''
  respectAgreement: boolean | ''
  hasExperience: boolean | ''
  experienceDetail: string
  motivation: string
  password: string
}

function emptyForm(initialType: CitizenProgramType): FormState {
  return {
    programType: initialType,
    name: '',
    phone: '',
    email: '',
    residence: '',
    age: '',
    gender: '',
    practiceAvailable: '',
    respectAgreement: '',
    hasExperience: '',
    experienceDetail: '',
    motivation: '',
    password: '',
  }
}

export function CitizenApplicationForm({
  initialType,
  onSuccess,
}: {
  initialType: CitizenProgramType
  onSuccess: () => void
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(initialType))
  const [consent, setConsent] = useState<PrivacyConsentValue>(emptyConsent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const practiceLabel =
    form.programType === 'reading' ? '주 2회 연습이 가능하신가요?' : '주 3회 연습이 가능하신가요?'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (form.gender === '' || form.practiceAvailable === '' || form.respectAgreement === '' || form.hasExperience === '') {
      setError('필수 항목을 모두 선택해주세요.')
      return
    }
    const passwordError = validatePassword(form.password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (form.hasExperience && !form.experienceDetail.trim()) {
      setError('어떤 경험이 있으신지 입력해주세요.')
      return
    }
    // 나이를 숫자로 직접 받으므로 별도 연령 확인 체크박스 없이 입력값으로 검증한다
    if (Number(form.age) < MIN_AGE) {
      setError(`시민참여 행사는 만 ${MIN_AGE}세 이상만 신청하실 수 있습니다.`)
      return
    }
    const consentError = validateConsent(consent, false)
    if (consentError) {
      setError(consentError)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/citizen-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programType: form.programType,
          name: form.name,
          phone: form.phone,
          email: form.email,
          residence: form.residence,
          age: Number(form.age),
          gender: form.gender,
          practiceAvailable: form.practiceAvailable,
          respectAgreement: form.respectAgreement,
          hasExperience: form.hasExperience,
          experienceDetail: form.hasExperience ? form.experienceDetail : undefined,
          motivation: form.motivation,
          password: form.password,
          // 동의를 받았다는 입증 책임이 운영자에게 있어 동의 여부와 시각을 함께 남긴다
          privacyAgreed: consent.privacyAgreed,
          agreedAt: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || '신청에 실패했습니다.')
      }
    } catch {
      setError('신청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="신청 구분 *">
        <RadioGroup
          value={form.programType}
          onValueChange={(value) => setForm({ ...form, programType: value as CitizenProgramType })}
          className="flex flex-col gap-2 sm:flex-row sm:gap-6"
        >
          <RadioOption value="reading" id="type-reading" label="열린 낭독극 참여" />
          <RadioOption value="short_play" id="type-short_play" label="열린 단막극 참여" />
        </RadioGroup>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="이름 *">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="연락처 *(숫자만 입력)">
          <Input required type="tel" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhoneInput(e.target.value) })} />
        </Field>
      </div>

      <Field label="이메일 *">
        <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>

      <Field label="사는곳 *">
        <Input required placeholder="서울시 종로구" value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`나이 * (만 ${MIN_AGE}세 이상 신청 가능)`}>
          <Input required type="number" min={MIN_AGE} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </Field>
        <Field label="성별 *">
          <RadioGroup value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value as FormState['gender'] })} className="flex gap-6 pt-2">
            <RadioOption value="male" id="gender-male" label="남성" />
            <RadioOption value="female" id="gender-female" label="여성" />
          </RadioGroup>
        </Field>
      </div>

      <YesNoField
        label={`${practiceLabel} *`}
        value={form.practiceAvailable}
        onChange={(value) => setForm({ ...form, practiceAvailable: value })}
        name="practiceAvailable"
      />

      <YesNoField
        label="함께하는 강사 및 동료분을 존중해주는 자세가 필요합니다. *"
        value={form.respectAgreement}
        onChange={(value) => setForm({ ...form, respectAgreement: value })}
        name="respectAgreement"
      />

      <YesNoField
        label="연극 관련 경험이 있으신가요? *"
        value={form.hasExperience}
        onChange={(value) => setForm({ ...form, hasExperience: value })}
        name="hasExperience"
      />

      {form.hasExperience && (
        <Field label="어떤 경험이 있으신가요? (1000자 이내) *">
          <Textarea
            required
            rows={4}
            maxLength={1000}
            value={form.experienceDetail}
            onChange={(e) => setForm({ ...form, experienceDetail: e.target.value })}
            placeholder="연극·낭독·공연 관련 경험을 자유롭게 작성해주세요."
          />
        </Field>
      )}

      <Field label="신청동기 및 각오 *">
        <Textarea required rows={4} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} placeholder="참여하고 싶은 이유와 각오를 작성해주세요." />
      </Field>

      <Field label="비밀번호 *" hint={PASSWORD_HINT}>
        <Input required minLength={PASSWORD_MIN_LENGTH} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="신청 내역 조회·수정 시 사용합니다" />
      </Field>

      <PrivacyConsent
        purpose="시민참여 행사 신청 접수, 참가 자격 확인 및 선발, 연습 일정 등 참가자 연락"
        items="이름, 연락처, 이메일주소, 거주지, 나이, 성별, 연극 관련 경험, 신청 동기"
        retention="축제 종료일로부터 1년 (기간 경과 후 지체 없이 파기)"
        disadvantage="신청이 접수되지 않습니다."
        ageLabel={null}
        value={consent}
        onChange={setConsent}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        신청하기
      </Button>
    </form>
  )
}
