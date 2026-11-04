import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { LoginForm } from './login-form'

export const metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const configured = hasSupabaseEnv()
  if (configured) {
    const user = await getCurrentUser()
    if (user) redirect('/dashboard')
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-hairline bg-paper p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-semibold text-white">
            E
          </span>
          <span className="font-display text-lg text-forest">EventsMa</span>
        </div>

        <h1 className="mt-5 text-lg font-semibold text-ink">Sign in to your workspace</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Use the email and password your workspace owner set up for you.
        </p>

        {configured ? (
          <LoginForm />
        ) : (
          <div className="mt-5 rounded-control bg-mint-subtle px-3 py-2.5 text-xs leading-relaxed text-forest">
            Auth is disabled until <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set. Until then the app runs in labelled
            demo mode — nothing here pretends to be a real session.
          </div>
        )}

        {configured ? null : (
          <Link
            href="/dashboard"
            className="mt-4 inline-flex text-sm text-forest underline-offset-4 hover:underline"
          >
            Continue in demo mode
          </Link>
        )}
      </div>
    </main>
  )
}
