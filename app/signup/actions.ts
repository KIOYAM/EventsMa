'use server'

import { redirect } from 'next/navigation'
import { appUrl, safeNext } from '@/lib/app-url'
import { getSupabaseServerClient } from '@/lib/auth/session'

export interface SignupState {
  error: string | null
  /** Set when Supabase requires the email to be confirmed before first sign-in. */
  sentTo: string | null
}

/**
 * Step 1 of 2. Creates the login only; the business details are captured on
 * /onboarding so a half-filled workspace can never exist.
 */
export async function signUp(_previous: SignupState, formData: FormData): Promise<SignupState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const next = safeNext(formData.get('next'), '/onboarding')

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'Enter the email your business uses.', sentTo: null }
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: 'Use at least 8 characters with a letter and a number.', sentTo: null }
  }
  if (password !== confirm) {
    return { error: 'The two passwords do not match.', sentTo: null }
  }

  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: 'Sign-up is not configured on this deployment.', sentTo: null }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) {
    const already = /already|registered|exists/i.test(error.message)
    const rateLimited = /rate limit|over_email_send_rate_limit|too many/i.test(error.message)
    return {
      error: already
        ? 'That email already has an account. Sign in instead.'
        : rateLimited
          ? 'Account creation is temporarily blocked: we cannot send confirmation emails right now. Please try again in a few minutes or contact admin@eventsma.in.'
          : 'We could not create the account. Try again in a moment.',
      sentTo: null,
    }
  }

  // Email confirmation on: no session yet, so ask the owner to confirm first.
  if (!data.session) return { error: null, sentTo: email }

  redirect(next)
}
