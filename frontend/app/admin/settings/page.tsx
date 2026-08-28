'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Image as ImageIcon, Type, Settings2 } from 'lucide-react'

interface HeroConfig {
  backgroundImage: string
  title: string
  subtitle: string
  description: string
  stats: {
    programs: number
    groups: number
    years: number
  }
}

interface SiteInfo {
  festivalName: string
  organizer: string
  year: string
  contactEmail: string
  contactPhone: string
  address: string
  snsLinks: {
    instagram?: string
    facebook?: string
    youtube?: string
    blog?: string
  }
}

const defaultHeroConfig: HeroConfig = {
  backgroundImage: '/images/hero-bg.jpg',
  title: '2026 가을연극축제',
  subtitle: '직장인들이 만들어가는 특별한 무대',
  description: '전국직장인연극단체협의회가 주최·주관하는 제X회 가을연극축제에 여러분을 초대합니다.',
  stats: {
    programs: 6,
    groups: 6,
    years: 10,
  },
}

const defaultSiteInfo: SiteInfo = {
  festivalName: '2026 가을연극축제',
  organizer: '전국직장인연극단체협의회',
  year: '2026',
  contactEmail: 'info@autumnfestival.kr',
  contactPhone: '02-1234-5678',
  address: '서울특별시 종로구 대학로 00',
  snsLinks: {
    instagram: '',
    facebook: '',
    youtube: '',
    blog: '',
  },
}

export default function AdminSettingsPage() {
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(defaultHeroConfig)
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const [heroRes, siteRes] = await Promise.all([
        fetch('/api/site-config?key=hero'),
        fetch('/api/site-config?key=siteInfo'),
      ])

      const heroData = await heroRes.json()
      const siteData = await siteRes.json()

      // 서버에 저장된 값이 예전 스키마 형태라 일부 필드(stats, snsLinks 등)가
      // 없을 수 있어, 기본값과 병합해 undefined 참조로 화면이 깨지지 않게 함
      if (heroData.data?.value) {
        setHeroConfig({
          ...defaultHeroConfig,
          ...heroData.data.value,
          stats: { ...defaultHeroConfig.stats, ...(heroData.data.value.stats || {}) },
        })
      }
      if (siteData.data?.value) {
        setSiteInfo({
          ...defaultSiteInfo,
          ...siteData.data.value,
          snsLinks: { ...defaultSiteInfo.snsLinks, ...(siteData.data.value.snsLinks || {}) },
        })
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error)
    }
  }

  const saveHeroConfig = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hero', value: heroConfig }),
      })

      if (res.ok) {
        setSaveMessage('히어로 설정이 저장되었습니다.')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save hero config:', error)
      setSaveMessage('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveSiteInfo = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'siteInfo', value: siteInfo }),
      })

      if (res.ok) {
        setSaveMessage('사이트 정보가 저장되었습니다.')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save site info:', error)
      setSaveMessage('저장에 실패했습니다.')
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
              메인 페이지 및 사이트 전반의 설정을 관리합니다.
            </p>
          </div>

          {saveMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700">
              {saveMessage}
            </div>
          )}

          <Tabs defaultValue="hero" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                히어로 섹션
              </TabsTrigger>
              <TabsTrigger value="site" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                사이트 정보
              </TabsTrigger>
            </TabsList>

            {/* 히어로 섹션 설정 */}
            <TabsContent value="hero">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    히어로 섹션 설정
                  </CardTitle>
                  <CardDescription>
                    메인 페이지 상단의 히어로 섹션을 수정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 배경 이미지 */}
                  <div className="space-y-2">
                    <Label>배경 이미지</Label>
                    <CloudinaryUpload
                      value={heroConfig.backgroundImage}
                      onChange={(url) =>
                        setHeroConfig({ ...heroConfig, backgroundImage: url as string })
                      }
                      folder="autumn_festival/hero"
                      placeholder="히어로 배경 이미지 업로드"
                      aspectRatio={16 / 9}
                    />
                  </div>

                  {/* 제목 */}
                  <div className="space-y-2">
                    <Label htmlFor="heroTitle">메인 제목</Label>
                    <Input
                      id="heroTitle"
                      value={heroConfig.title}
                      onChange={(e) =>
                        setHeroConfig({ ...heroConfig, title: e.target.value })
                      }
                      placeholder="2026 가을연극축제"
                    />
                  </div>

                  {/* 부제목 */}
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">부제목</Label>
                    <Input
                      id="heroSubtitle"
                      value={heroConfig.subtitle}
                      onChange={(e) =>
                        setHeroConfig({ ...heroConfig, subtitle: e.target.value })
                      }
                      placeholder="직장인들이 만들어가는 특별한 무대"
                    />
                  </div>

                  {/* 설명 */}
                  <div className="space-y-2">
                    <Label htmlFor="heroDescription">설명</Label>
                    <Textarea
                      id="heroDescription"
                      value={heroConfig.description}
                      onChange={(e) =>
                        setHeroConfig({ ...heroConfig, description: e.target.value })
                      }
                      placeholder="축제 설명을 입력하세요"
                      rows={3}
                    />
                  </div>

                  {/* 통계 */}
                  <div className="space-y-2">
                    <Label>통계 수치</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="statPrograms" className="text-xs text-muted-foreground">
                          공연 수
                        </Label>
                        <Input
                          id="statPrograms"
                          type="number"
                          value={heroConfig.stats.programs}
                          onChange={(e) =>
                            setHeroConfig({
                              ...heroConfig,
                              stats: { ...heroConfig.stats, programs: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="statGroups" className="text-xs text-muted-foreground">
                          참여 극단
                        </Label>
                        <Input
                          id="statGroups"
                          type="number"
                          value={heroConfig.stats.groups}
                          onChange={(e) =>
                            setHeroConfig({
                              ...heroConfig,
                              stats: { ...heroConfig.stats, groups: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="statYears" className="text-xs text-muted-foreground">
                          축제 회차
                        </Label>
                        <Input
                          id="statYears"
                          type="number"
                          value={heroConfig.stats.years}
                          onChange={(e) =>
                            setHeroConfig({
                              ...heroConfig,
                              stats: { ...heroConfig.stats, years: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveHeroConfig} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        히어로 설정 저장
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 사이트 정보 설정 */}
            <TabsContent value="site">
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
