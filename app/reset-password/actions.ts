'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/auth/session'

export interface ResetState {
  error: string | null
}

export async function updatePassword(
  _previous: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: 'Use at least 8 characters with a letter and a number.' }
  }
  if (password !== confirm) return { error: 'The two passwords do not match.' }

  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: 'Password reset is not configured on this deployment.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'That reset link has expired. Request a new one.' }
  }

  redirect('/login?reset=1')
}
