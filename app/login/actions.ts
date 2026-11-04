'use server'

import { redirect } from 'next/navigation'
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

  if (!email || !password) return { error: 'Enter your work email and password.' }

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return { error: 'Sign-in is not configured on this deployment.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // One message for both wrong password and unknown email: do not confirm accounts.
  if (error) return { error: 'That email and password do not match an account.' }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServerClient()
  await supabase?.auth.signOut()
  redirect('/login')
}
