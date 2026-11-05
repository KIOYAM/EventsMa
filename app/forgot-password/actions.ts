'use server'

import { appUrl } from '@/lib/app-url'
import { getSupabaseServerClient } from '@/lib/auth/session'

export interface ForgotState {
  error: string | null
  sent: boolean
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function requestPasswordReset(
  _previous: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!EMAIL.test(email)) return { error: 'Enter the email you use for this business.', sent: false }

  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: 'Password reset is not configured on this deployment.', sent: false }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
  })

  // Never reveal whether an email is registered. A rate-limit failure is the
  // only case we surface, and even then the wording is generic.
  if (error && /rate|limit/i.test(error.message)) {
    return { error: 'Too many requests. Wait a minute, then try again.', sent: false }
  }

  return { error: null, sent: true }
}
