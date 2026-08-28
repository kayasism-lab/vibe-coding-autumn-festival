'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Film, Calendar, FileText, MessageSquare, Users, Eye } from 'lucide-react'
import { getScheduleStart, type FestivalSchedule } from '@/lib/festival-schedule'
import { formatNoticeDate, getNoticeCategoryLabel, type NoticeCategory } from '@/lib/notice-board'

type RecentInquiry = {
  _id: string
  title: string
  name: string
  status: 'pending' | 'answered'
  createdAt: string
}

type RecentNotice = {
  _id: string
  title: string
  category: NoticeCategory
  viewCount: number
  publishedAt?: string
  createdAt: string
}

type Dashboard = {
  programCount: number
  upcomingCount: number
  noticeCount: number
  /** 문의는 권한이 있는 계정만 볼 수 있어 못 받는 경우가 있다. 그때는 null */
  pendingInquiryCount: number | null
  recentInquiries: RecentInquiry[] | null
  recentNotices: RecentNotice[]
}

const EMPTY: Dashboard = {
  programCount: 0,
  upcomingCount: 0,
  noticeCount: 0,
  pendingInquiryCount: null,
  recentInquiries: null,
  recentNotices: [],
}

/** 응답을 한 겹 벗겨 준다. 실패하면 null이라 부르는 쪽에서 기본값을 쓴다 */
async function getData<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    const body = await res.json()
    return body.success ? (body.data as T) : null
  } catch {
    return null
  }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [programs, schedules, notices, inquiries, pendingInquiries] = await Promise.all([
        getData<{ _id: string }[]>('/api/programs'),
        getData<FestivalSchedule[]>('/api/schedules'),
        // 관리자 공지 화면이 종류를 가리지 않고 전부 다루므로 여기서도 같은 기준으로 센다
        getData<{ items: RecentNotice[]; total: number }>('/api/notices?limit=3'),
        getData<{ items: RecentInquiry[]; total: number }>('/api/inquiries?limit=3'),
        getData<{ total: number }>('/api/inquiries?status=pending&limit=1'),
      ])

      // 날짜만 보면 오늘 공연이 빠지므로, 카운트다운과 같은 계산으로 시작 시각을 구해 센다
      const now = Date.now()
      const upcomingCount = (schedules ?? []).filter((schedule) => {
        const start = getScheduleStart(schedule)
        return start !== null && start.getTime() > now
      }).length

      setData({
        programCount: programs?.length ?? 0,
        upcomingCount,
        noticeCount: notices?.total ?? 0,
        pendingInquiryCount: pendingInquiries?.total ?? null,
        recentInquiries: inquiries?.items ?? null,
        recentNotices: notices?.items ?? [],
      })
      setIsLoading(false)
    }

    void load()
  }, [])

  const stats = [
    { label: '전체 프로그램', value: data.programCount, icon: Film, href: '/admin/programs' },
    { label: '예정된 공연', value: data.upcomingCount, icon: Calendar, href: '/admin/schedules' },
    { label: '공지사항', value: data.noticeCount, icon: FileText, href: '/admin/notices' },
    {
      label: '문의 (미답변)',
      value: data.pendingInquiryCount,
      icon: MessageSquare,
      href: '/admin/inquiries',
    },
  ]

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />

      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
            <p className="text-muted-foreground">2026 가을연극축제 관리자 페이지입니다.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.label} href={stat.href}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold text-foreground mt-1">
                            {/* 아직 못 받았거나 볼 권한이 없으면 숫자 대신 자리만 둔다 */}
                            {isLoading || stat.value === null ? '–' : stat.value}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  최근 문의
                </CardTitle>
                <CardDescription>최근 등록된 문의 목록입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</p>
                ) : data.recentInquiries === null ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    문의를 볼 수 있는 권한이 없습니다.
                  </p>
                ) : data.recentInquiries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    등록된 문의가 없습니다.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {data.recentInquiries.map((inquiry) => (
                      <li key={inquiry._id}>
                        <Link
                          href="/admin/inquiries"
                          className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg transition-colors hover:bg-muted/70"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {inquiry.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {inquiry.name} · {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${
                              inquiry.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {inquiry.status === 'pending' ? '대기' : '완료'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  최근 공지
                </CardTitle>
                <CardDescription>최근 등록된 공지사항입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</p>
                ) : data.recentNotices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    등록된 공지가 없습니다.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {data.recentNotices.map((notice) => (
                      <li key={notice._id}>
                        <Link
                          href="/admin/notices"
                          className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg transition-colors hover:bg-muted/70"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notice.title}
                            </p>
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                              {/* 공지와 보도가 한 목록에 섞여 있어 종류를 함께 보여준다 */}
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                {getNoticeCategoryLabel(notice.category)}
                              </Badge>
                              {formatNoticeDate(notice)}
                            </p>
                          </div>
                          <span className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {notice.viewCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                빠른 실행
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { href: '/admin/programs', icon: Film, label: '프로그램 관리' },
                  { href: '/admin/schedules', icon: Calendar, label: '일정 관리' },
                  { href: '/admin/notices', icon: FileText, label: '공지 작성' },
                  { href: '/admin/inquiries', icon: MessageSquare, label: '문의 답변' },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-center"
                    >
                      <Icon className="h-6 w-6 mx-auto text-primary mb-2" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
