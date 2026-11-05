import { NextResponse } from 'next/server'
import { safeNext } from '@/lib/app-url'
import { getSupabaseServerClient } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * PKCE callback for sign-up confirmation, magic links, recovery and invites.
 * The `next` value is restricted to a same-origin path so a crafted link cannot
 * turn the callback into an open redirect.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const next = safeNext(url.searchParams.get('next'))
  const supabase = await getSupabaseServerClient()

  if (!supabase) {
    return NextResponse.redirect(new URL('/login?error=config', url.origin))
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL('/login?error=link', url.origin))
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'invite' | 'recovery' | 'email_change' | 'email',
    })
    if (error) return NextResponse.redirect(new URL('/login?error=link', url.origin))
  } else {
    return NextResponse.redirect(new URL('/login?error=link', url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
