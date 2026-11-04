'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/auth/session'

export interface SignupState {
  error: string | null
  /** Set when Supabase requires the email to be confirmed before first sign-in. */
  sentTo: string | null
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '')
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
    options: { emailRedirectTo: `${appUrl()}/login` },
  })

  if (error) {
    const already = /already|registered|exists/i.test(error.message)
    return {
      error: already
        ? 'That email already has an account. Sign in instead.'
        : 'We could not create the account. Try again in a moment.',
      sentTo: null,
    }
  }

  // Email confirmation on: no session yet, so ask the owner to confirm first.
  if (!data.session) return { error: null, sentTo: email }

  redirect('/onboarding')
}
