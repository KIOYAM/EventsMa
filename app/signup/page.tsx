import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { safeNext } from '@/lib/app-url'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { SignupForm } from './signup-form'

export const metadata = {
  title: 'Create your business account',
  robots: { index: false, follow: false },
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const next = safeNext(params.next, '/onboarding')
  const configured = hasSupabaseEnv()
  if (configured) {
    const user = await getCurrentUser()
    if (user) redirect(next)
  }

  return (
    <AuthShell
      active="signup"
      step="Step 1 of 2 - your login"
      title="Create your business account"
      description="This is the login for your event business, not a personal profile. One email and password give you and your team the workspace."
    >
      {configured ? (
        <SignupForm next={next} />
      ) : (
        <div className="mt-5 rounded-control bg-mint-subtle px-3 py-2.5 text-xs leading-relaxed text-forest">
          Sign-up is not configured on this deployment. Set <code>NEXT_PUBLIC_SUPABASE_URL</code>{' '}
          and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then redeploy.
        </div>
      )}

      <p className="mt-5 border-t border-hairline pt-4 text-sm text-ink-muted">
        Already have a workspace?{' '}
        <Link href="/login" className="font-medium text-forest underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
