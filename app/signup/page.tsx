import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { SignupForm } from './signup-form'

export const metadata = { title: 'Create your business account' }

export default async function SignupPage() {
  const configured = hasSupabaseEnv()
  if (configured) {
    const user = await getCurrentUser()
    if (user) redirect('/dashboard')
  }

  return (
    <AuthShell
      active="signup"
      step="Step 1 of 2 · your login"
      title="Create your business account"
      description="This is the login for your event business, not a personal profile. One email and password give you and your team the workspace."
    >
      {configured ? (
        <SignupForm />
      ) : (
        <div className="mt-5 rounded-control bg-mint-subtle px-3 py-2.5 text-xs leading-relaxed text-forest">
          Sign-up is not configured on this deployment. Set <code>NEXT_PUBLIC_SUPABASE_URL</code>{' '}
          and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then redeploy.
        </div>
      )}
    </AuthShell>
  )
}
