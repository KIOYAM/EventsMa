'use server'

import { redirect } from 'next/navigation'
import { safeNext } from '@/lib/app-url'
import { getSupabaseServerClient } from '@/lib/auth/session'

export interface LoginState {
  error: string | null
}

/**
 * Email + password sign-in. The password never leaves this server action: the
 * browser only posts it once, and the session lands in an http-only cookie.
 */
export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData.get('next'))

  if (!email || !password) return { error: 'Enter your work email and password.' }

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return { error: 'Sign-in is not configured on this deployment.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Supabase returns "Email not confirmed" when email confirmation is on and
    // the account exists but hasn't been verified yet.
    const notConfirmed = /email not confirmed|not confirmed|confirm your email/i.test(error.message)
    return {
      error: notConfirmed
        ? 'That account exists but hasn’t been confirmed yet. Check your email for the confirmation link, or contact admin@eventsma.in.'
        : 'That email and password do not match an account.',
    }
  }

  redirect(next)
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServerClient()
  await supabase?.auth.signOut()
  redirect('/login')
}
