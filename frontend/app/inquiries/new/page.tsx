'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  PrivacyConsent,
  emptyConsent,
  validateConsent,
  type PrivacyConsentValue,
} from '@/components/shared/privacy-consent'
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH, validatePassword } from '@/lib/password-policy'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewInquiryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    content: '',
    password: '',
    isPrivate: false,
  })
  const [consent, setConsent] = useState<PrivacyConsentValue>(emptyConsent)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      alert(passwordError)
      return
    }

    // 만 14세 미만 아동은 법정대리인 동의가 필요해 문의를 받지 않는다
    const consentError = validateConsent(consent, true, '만 14세 이상인지 확인에 체크해주세요.')
    if (consentError) {
      alert(consentError)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // 동의 사실에 대한 입증 책임이 운영자에게 있어 함께 저장한다
          privacyAgreed: consent.privacyAgreed,
          ageConfirmed: consent.ageConfirmed,
          agreedAt: new Date().toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert('문의가 등록되었습니다.')
        router.push('/inquiries')
      } else {
        alert(result.error || '문의 등록에 실패했습니다.')
      }
    } catch {
      alert('문의 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="pt-[8.25rem]">
        <PageHeader
          hero="bulbs"
          subtitle="Inquiry"
          title="문의 작성"
          description="축제에 관해 궁금한 점을 남겨주세요."
        />

        <section className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/inquiries"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="답변을 받으실 이메일"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호 *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="문의 확인용 비밀번호"
                  />
                  <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="문의 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="문의 내용을 입력하세요"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPrivate: checked as boolean })
                  }
                />
                <Label htmlFor="isPrivate" className="text-sm cursor-pointer">
                  비공개 문의로 등록
                </Label>
              </div>

              <PrivacyConsent
                purpose="문의 내용 확인 및 처리 결과 회신"
                items="이름, 이메일주소, 연락처"
                retention="축제 종료일로부터 1년 (기간 경과 후 지체 없이 파기)"
                disadvantage="문의를 접수할 수 없습니다."
                ageLabel="만 14세 이상입니다."
                value={consent}
                onChange={setConsent}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    '문의 등록'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
