'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'

const contactInfo = [
  {
    icon: MapPin,
    label: '주소',
    value: '서울 관악구 남부순환로272길 22 2층\n전국직장인연극단체협의회 사무국',
  },
  {
    icon: Phone,
    label: '전화',
    value: '010-9073-8894',
  },
  {
    icon: Mail,
    label: '이메일',
    value: 'kayasism@naver.com',
  },
  {
    icon: Clock,
    label: '운영 시간',
    value: '평일 09:00 - 18:00\n(주말 및 공휴일 휴무)',
  },
]

const mapQuery = encodeURIComponent('서울 관악구 남부순환로272길 22')

const inquiryTypes = [
  { value: 'general', label: '일반 문의' },
  { value: 'ticket', label: '예매 문의' },
  { value: 'sponsor', label: '후원 문의' },
  { value: 'media', label: '언론/취재 문의' },
  { value: 'volunteer', label: '자원봉사 문의' },
  { value: 'other', label: '기타' },
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  type: '',
  subject: '',
  message: '',
}

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const typeLabel = inquiryTypes.find((t) => t.value === form.type)?.label || '일반 문의'

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          title: `[${typeLabel}] ${form.subject}`,
          content: form.message,
          password: crypto.randomUUID(),
          isPrivate: false,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setIsSubmitted(true)
      } else {
        setError(data.error || '문의 접수에 실패했습니다.')
      }
    } catch {
      setError('문의 접수 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-[8.25rem]">
        <PageHeader
          hero="bulbs"
          subtitle="Contact"
          title="연락처"
          description="가을연극축제에 대한 문의사항이 있으시면 언제든지 연락주세요."
        />

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  사무국 안내
                </h2>
                <div className="space-y-6 mb-10">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {info.label}
                          </p>
                          <p className="text-foreground whitespace-pre-line">
                            {info.value}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Map */}
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="전국직장인연극단체협의회 사무국 위치"
                  />
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  문의하기
                </h2>

                {isSubmitted ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        문의가 접수되었습니다
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        빠른 시일 내에 답변 드리겠습니다.
                      </p>
                      <Button
                        onClick={() => {
                          setForm(initialForm)
                          setIsSubmitted(false)
                        }}
                      >
                        추가 문의하기
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">이름 *</Label>
                            <Input
                              id="name"
                              required
                              placeholder="홍길동"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">이메일 *</Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              placeholder="example@email.com"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">연락처</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="010-1234-5678"
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="type">문의 유형 *</Label>
                            <Select
                              required
                              value={form.type}
                              onValueChange={(type) => setForm({ ...form, type })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="문의 유형 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {inquiryTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">제목 *</Label>
                          <Input
                            id="subject"
                            required
                            placeholder="문의 제목을 입력하세요"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">내용 *</Label>
                          <Textarea
                            id="message"
                            required
                            rows={6}
                            placeholder="문의 내용을 입력하세요"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                          />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <div className="text-sm text-muted-foreground">
                          * 표시는 필수 항목입니다.
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            '전송 중...'
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              문의 보내기
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              자주 묻는 질문
            </h2>
            <p className="text-muted-foreground mb-8">
              문의하시기 전에 자주 묻는 질문을 확인해 보세요.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
              {[
                { q: '관람료가 있나요?', a: '전 프로그램 무료입니다. 사전 예약을 통해 관람하실 수 있습니다.' },
                { q: '관람 신청(예약)은 어떻게 하나요?', a: '공연 일정 페이지에서 원하는 회차의 예약 링크를 통해 신청할 수 있습니다.' },
                { q: '시민도 공연에 참여할 수 있나요?', a: '네, 열린 낭독극·열린 단막극은 일반 시민 공개모집으로 진행됩니다. 시민 참여 페이지를 확인해주세요.' },
              ].map((faq, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <p className="font-medium text-foreground mb-2">{faq.q}</p>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
