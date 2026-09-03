import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (request.nextUrl.pathname.startsWith('/admin') && !isLoginPage && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 로그인 페이지는 로그인 여부와 무관하게 항상 접근 가능해야 한다.
  // 예전엔 로그인 상태면 무조건 /admin으로 보냈는데, /admin은 극단별 계정 중
  // my-group 권한이 없는 낭독극/단막극 계정은 접근할 수 없는 경로라
  // "접근 권한이 없습니다" 화면에 갇히고 로그인 폼을 다시 볼 방법이 없었다.
  // 실제 이동 처리는 AdminAuthGuard/로그인 폼 쪽에서 역할별 권한을 보고 판단한다.

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
