import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Check if user is onboarded
    if (req.nextauth.token?.onboarded === false &&
        !req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding/step1', req.url))
    }

    // Protect admin routes - verify admin role
    if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
      if (req.nextauth.token?.role !== 'admin') {
        // Redirect to login if not authenticated
        if (!req.nextauth.token) {
          return NextResponse.redirect(new URL('/login?redirect=' + req.nextUrl.pathname, req.url))
        }
        // Show 403 if authenticated but not admin
        return NextResponse.rewrite(new URL('/403', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rooms/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/protected/:path*'
  ]
}
