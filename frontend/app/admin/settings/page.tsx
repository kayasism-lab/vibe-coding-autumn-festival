'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Type } from 'lucide-react'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { defaultSiteInfo, type SiteInfo } from '@/lib/site-info'

// 예전에는 이 페이지에 "히어로 섹션" 탭도 있었으나, 실제 홈 화면 히어로
// (components/home/hero-section.tsx)는 배경 이미지·제목·통계가 전부 여기 스키마와
// 구조가 달라 저장해도 화면에 반영되지 않았고, 저장된 값도 없었다.
// 2026-09-03 세션에서 "사이트 정보" 탭만 남기기로 정리 — 상세 내용은
// docs/handoff.md의 사이트 설정 관련 절 참고

export default function AdminSettingsPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  // 저장 실패 사유. 성공 안내(초록)와 구분해 붉게 보여준다
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/site-config?key=siteInfo')
      const data = await res.json()

      // 서버에 저장된 값이 예전 스키마 형태라 일부 필드(snsLinks 등)가
      // 없을 수 있어, 기본값과 병합해 undefined 참조로 화면이 깨지지 않게 함
      if (data.data?.value) {
        setSiteInfo({
          ...defaultSiteInfo,
          ...data.data.value,
          snsLinks: { ...defaultSiteInfo.snsLinks, ...(data.data.value.snsLinks || {}) },
        })
      }
    } catch (error) {
      console.error('Failed to fetch site config:', error)
    }
  }

  const saveSiteInfo = async () => {
    setIsSaving(true)
    setSaveError('')
    try {
      const res = await adminFetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'siteInfo', value: siteInfo }),
      })

      if (res.ok) {
        setSaveMessage('사이트 정보가 저장되었습니다.')
        setTimeout(() => setSaveMessage(''), 3000)
        return
      }

      setSaveError(await getErrorMessage(res))
    } catch {
      setSaveError('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">사이트 설정</h1>
            <p className="text-muted-foreground mt-1">
              푸터·오시는 길·극단 참가 신청 안내에 쓰이는 사무국 연락처와 SNS 링크를 관리합니다.
            </p>
          </div>

          {saveMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700">
              {saveMessage}
            </div>
          )}

          {saveError && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              {saveError}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                사이트 기본 정보
              </CardTitle>
              <CardDescription>
                축제 및 운영 단체의 기본 정보를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="festivalName">축제명</Label>
                  <Input
                    id="festivalName"
                    value={siteInfo.festivalName}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, festivalName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer">주최·주관 단체</Label>
                  <Input
                    id="organizer"
                    value={siteInfo.organizer}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, organizer: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">연락처 이메일</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={siteInfo.contactEmail}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, contactEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">연락처 전화번호</Label>
                  <Input
                    id="contactPhone"
                    value={siteInfo.contactPhone}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, contactPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={siteInfo.address}
                  onChange={(e) =>
                    setSiteInfo({ ...siteInfo, address: e.target.value })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>SNS 링크</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-xs text-muted-foreground">
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={siteInfo.snsLinks.instagram || ''}
                      onChange={(e) =>
                        setSiteInfo({
                          ...siteInfo,
                          snsLinks: { ...siteInfo.snsLinks, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-xs text-muted-foreground">
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={siteInfo.snsLinks.facebook || ''}
                      onChange={(e) =>
                        setSiteInfo({
                          ...siteInfo,
                          snsLinks: { ...siteInfo.snsLinks, facebook: e.target.value },
                        })
                      }
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube" className="text-xs text-muted-foreground">
                      YouTube
                    </Label>
                    <Input
                      id="youtube"
                      value={siteInfo.snsLinks.youtube || ''}
                      onChange={(e) =>
                        setSiteInfo({
                          ...siteInfo,
                          snsLinks: { ...siteInfo.snsLinks, youtube: e.target.value },
                        })
                      }
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blog" className="text-xs text-muted-foreground">
                      Blog
                    </Label>
                    <Input
                      id="blog"
                      value={siteInfo.snsLinks.blog || ''}
                      onChange={(e) =>
                        setSiteInfo({
                          ...siteInfo,
                          snsLinks: { ...siteInfo.snsLinks, blog: e.target.value },
                        })
                      }
                      placeholder="https://blog.naver.com/..."
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveSiteInfo} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    사이트 정보 저장
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
