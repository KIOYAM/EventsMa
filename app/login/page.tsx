import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { LoginForm } from './login-form'

export const metadata = { title: 'Sign in to your business' }

export default async function LoginPage() {
  const configured = hasSupabaseEnv()
  if (configured) {
    const user = await getCurrentUser()
    if (user) redirect('/dashboard')
  }

  return (
    <AuthShell
      active="signin"
      step="Existing business · sign in"
      title="Sign in to your business workspace"
      description="Use the work email and password you created for your event business. Your quotes, invoices and team are already inside."
    >
      {configured ? (
        <LoginForm />
      ) : (
        <div className="mt-5 rounded-control bg-mint-subtle px-3 py-2.5 text-xs leading-relaxed text-forest">
          Sign-in is not configured on this deployment. Set{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then
          redeploy.
        </div>
      )}

      <p className="mt-5 border-t border-hairline pt-4 text-sm text-ink-muted">
        New here?{' '}
        <Link href="/signup" className="font-medium text-forest underline-offset-4 hover:underline">
          Create your business account
        </Link>{' '}
        — it takes about a minute.
      </p>
    </AuthShell>
  )
}
