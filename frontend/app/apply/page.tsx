'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { CheckCircle2, Loader2, FileText, Users, Send } from 'lucide-react'
import { useSiteInfo } from '@/lib/site-info'

interface FormData {
  groupName: string
  representative: string
  email: string
  phone: string
  memberCount: number
  attachmentUrls: string[]
}

const initialFormData: FormData = {
  groupName: '',
  representative: '',
  email: '',
  phone: '',
  memberCount: 10,
  attachmentUrls: [],
}

export default function ApplyPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  // 문의 이메일은 관리자 설정(/admin/settings) 값을 따른다. 미설정 시 기존 값 유지
  const siteInfo = useSiteInfo()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || '신청에 실패했습니다.')
      }
    } catch {
      setError('신청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <>
        <Header />
        <main className="pt-[8.25rem] min-h-screen bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-xl mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">신청이 완료되었습니다</h1>
              <p className="text-muted-foreground mb-8">
                참가 신청이 정상적으로 접수되었습니다.<br />
                심사 결과는 입력하신 이메일로 안내드리겠습니다.
              </p>
              <Button asChild>
                <a href="/">홈으로 돌아가기</a>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-[8.25rem] min-h-screen bg-gradient-to-b from-background to-muted/30">
        <PageHeader
          hero="actor"
          title="참가 신청"
          subtitle="2027 가을연극축제 참가 신청"
          description="2027년 가을연극축제에 참가를 희망하는 아마추어 및 직장인 극단은 아래 양식에 따라 신청해주세요."
        />

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* 신청 안내 */}
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    신청 안내
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>- 신청 기간: 2026년 9월 1일 ~ 12월 31일</p>
                  <p>- 참가 자격: 직장인 연극 동호회 또는 아마추어 극단</p>
                  <p>- 심사 결과: 2027년 1월 중 개별 통보</p>
                  <p>- 문의: {siteInfo.contactEmail}</p>
                </CardContent>
              </Card>

              {/* 신청 폼 */}
              <Card>
                <CardHeader>
                  <CardTitle>참가 신청서</CardTitle>
                  <CardDescription>
                    * 표시는 필수 입력 항목입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 극단 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        극단 정보
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="groupName">극단명 *</Label>
                          <Input
                            id="groupName"
                            value={formData.groupName}
                            onChange={(e) =>
                              setFormData({ ...formData, groupName: e.target.value })
                            }
                            required
                            placeholder="극단 이름을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="representative">대표자명 *</Label>
                          <Input
                            id="representative"
                            value={formData.representative}
                            onChange={(e) =>
                              setFormData({ ...formData, representative: e.target.value })
                            }
                            required
                            placeholder="대표자 성함"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">이메일 *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                            placeholder="연락받을 이메일"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">연락처 *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            required
                            placeholder="010-0000-0000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="memberCount">단원 수 *</Label>
                          <Input
                            id="memberCount"
                            type="number"
                            min={1}
                            value={formData.memberCount}
                            onChange={(e) =>
                              setFormData({ ...formData, memberCount: parseInt(e.target.value) || 1 })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* 첨부파일 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">첨부파일 (선택)</h3>
                      <p className="text-sm text-muted-foreground">
                        극단 소개서, 과거 공연 사진 등을 첨부해주세요.
                      </p>
                      <CloudinaryUpload
                        value={formData.attachmentUrls}
                        onChange={(urls) =>
                          setFormData({ ...formData, attachmentUrls: urls as string[] })
                        }
                        multiple
                        maxFiles={5}
                        folder="autumn_festival/applications"
                        placeholder="파일 업로드 (최대 5개)"
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          신청 중...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          참가 신청하기
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
