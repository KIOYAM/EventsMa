import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { ResetForm } from './reset-form'

export const metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage() {
  if (!hasSupabaseEnv()) {
    return (
      <AuthShell
        active="signin"
        step="Account recovery"
        title="Choose a new password"
        description="Password reset is not configured on this deployment."
      >
        <p className="mt-5 text-sm text-ink-muted">Set the Supabase environment variables, then redeploy.</p>
      </AuthShell>
    )
  }

  const user = await getCurrentUser()
  if (!user) redirect('/forgot-password?error=session')

  return (
    <AuthShell
      active="signin"
      step="Account recovery"
      title="Choose a new password"
      description={`Signed in as ${user.email ?? 'this account'}. Set a new password for next time.`}
    >
      <ResetForm />
    </AuthShell>
  )
}
