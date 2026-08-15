import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Calendar, FileText, MessageSquare, Users, Eye } from 'lucide-react'

// 임시 통계 데이터
const stats = [
  { label: '전체 프로그램', value: 6, icon: Film },
  { label: '예정된 공연', value: 12, icon: Calendar },
  { label: '공지사항', value: 8, icon: FileText },
  { label: '문의 (미답변)', value: 2, icon: MessageSquare },
]

const recentInquiries = [
  { id: '1', title: '티켓 예매 관련 문의', name: '김문의', status: 'answered', date: '2026-04-11' },
  { id: '2', title: '단체 관람 가능한가요?', name: '이단체', status: 'pending', date: '2026-04-10' },
  { id: '3', title: '자원봉사 관련 문의', name: '최봉사', status: 'pending', date: '2026-04-08' },
]

const recentNotices = [
  { id: '1', title: '2026 가을연극축제 참가 극단 모집 안내', views: 523, date: '2026-04-10' },
  { id: '2', title: '축제 자원봉사자 모집', views: 412, date: '2026-04-08' },
  { id: '3', title: '작년 가을연극축제 하이라이트 영상 공개', views: 1024, date: '2026-04-05' },
]

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />

      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
            <p className="text-muted-foreground">
              2026 가을연극축제 관리자 페이지입니다.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold text-foreground mt-1">
                          {stat.value}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Inquiries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  최근 문의
                </CardTitle>
                <CardDescription>최근 등록된 문의 목록입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {recentInquiries.map((inquiry) => (
                    <li
                      key={inquiry.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inquiry.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inquiry.name} · {inquiry.date}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          inquiry.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {inquiry.status === 'pending' ? '대기' : '완료'}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recent Notices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  최근 공지
                </CardTitle>
                <CardDescription>최근 등록된 공지사항입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {recentNotices.map((notice) => (
                    <li
                      key={notice.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notice.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notice.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {notice.views}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                빠른 실행
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href="/admin/programs"
                  className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-center"
                >
                  <Film className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="text-sm font-medium">프로그램 관리</span>
                </a>
                <a
                  href="/admin/schedules"
                  className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-center"
                >
                  <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="text-sm font-medium">일정 관리</span>
                </a>
                <a
                  href="/admin/notices"
                  className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-center"
                >
                  <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="text-sm font-medium">공지 작성</span>
                </a>
                <a
                  href="/admin/inquiries"
                  className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-center"
                >
                  <MessageSquare className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="text-sm font-medium">문의 답변</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
