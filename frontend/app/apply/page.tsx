'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { CheckCircle2, Loader2, FileText, Users, Clock, Send } from 'lucide-react'

interface FormData {
  groupName: string
  representative: string
  email: string
  phone: string
  playTitle: string
  playType: 'play' | 'musical' | 'short_play'
  runtime: number
  synopsis: string
  memberCount: number
  attachmentUrls: string[]
}

const initialFormData: FormData = {
  groupName: '',
  representative: '',
  email: '',
  phone: '',
  playTitle: '',
  playType: 'play',
  runtime: 60,
  synopsis: '',
  memberCount: 10,
  attachmentUrls: [],
}

export default function ApplyPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

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
        <main className="pt-[9.5rem] min-h-screen bg-gradient-to-b from-background to-muted/30">
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
      <main className="pt-[9.5rem] min-h-screen bg-gradient-to-b from-background to-muted/30">
        <PageHeader
          title="참가 신청"
          subtitle="2026 가을연극축제 참가 신청"
          description="축제에 참가를 희망하는 극단은 아래 양식을 작성하여 신청해주세요."
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
                  <p>- 신청 기간: 2026년 5월 1일 ~ 6월 30일</p>
                  <p>- 참가 자격: 직장인 연극 동호회 또는 극단</p>
                  <p>- 심사 결과: 7월 중 개별 통보</p>
                  <p>- 문의: festival@autumn2026.kr</p>
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

                    {/* 작품 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        작품 정보
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="playTitle">작품명 *</Label>
                          <Input
                            id="playTitle"
                            value={formData.playTitle}
                            onChange={(e) =>
                              setFormData({ ...formData, playTitle: e.target.value })
                            }
                            required
                            placeholder="공연할 작품 제목"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>작품 유형 *</Label>
                          <RadioGroup
                            value={formData.playType}
                            onValueChange={(value) =>
                              setFormData({ ...formData, playType: value as FormData['playType'] })
                            }
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="play" id="play" />
                              <Label htmlFor="play" className="font-normal cursor-pointer">
                                연극
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="musical" id="musical" />
                              <Label htmlFor="musical" className="font-normal cursor-pointer">
                                뮤지컬
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="short_play" id="short_play" />
                              <Label htmlFor="short_play" className="font-normal cursor-pointer">
                                단막극
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="runtime" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            러닝타임 (분) *
                          </Label>
                          <Input
                            id="runtime"
                            type="number"
                            min={10}
                            max={180}
                            value={formData.runtime}
                            onChange={(e) =>
                              setFormData({ ...formData, runtime: parseInt(e.target.value) || 60 })
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="synopsis">작품 시놉시스 *</Label>
                          <Textarea
                            id="synopsis"
                            value={formData.synopsis}
                            onChange={(e) =>
                              setFormData({ ...formData, synopsis: e.target.value })
                            }
                            required
                            rows={6}
                            placeholder="작품의 줄거리와 특징을 설명해주세요"
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
