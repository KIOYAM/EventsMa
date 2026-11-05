import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Supabase rotates the session cookie on every refresh. Server Components cannot
 * write cookies during render, so the refresh happens here and the browser keeps
 * the rotated value for the next request.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Demo mode: no auth env, so there is no session to refresh.
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items: { name: string; value: string; options?: CookieOptions }[]) => {
        for (const { name, value } of items) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of items) response.cookies.set(name, value, options)
      },
    },
  })

  // Touching getUser() is what triggers the refresh. The result is not trusted here;
  // requireWorkspace() asks the auth server again before rendering a tenant.
  await supabase.auth.getUser()

  return response
}

export const config = {
  // Session refresh only where a session can change what is rendered. Public
  // storefronts, quote links, health and vitals are deliberately excluded: they
  // must stay cacheable and must not pay for an auth round trip.
  matcher: [
    '/dashboard/:path*',
    '/events/:path*',
    '/clients/:path*',
    '/quotes/:path*',
    '/invoices/:path*',
    '/finance/:path*',
    '/reports/:path*',
    '/team/:path*',
    '/services/:path*',
    '/portfolio/:path*',
    '/storefront/:path*',
    '/settings/:path*',
    '/catalogue/:path*',
    '/menu/:path*',
    '/packages/:path*',
    '/inventory/:path*',
    '/me/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/invite/:path*',
    '/api/quotes/:path*',
    '/api/exports/:path*',
  ],
}
