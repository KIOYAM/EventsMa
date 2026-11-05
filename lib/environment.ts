import 'server-only'
import { isDatabaseConfigured } from '@/lib/db/client'

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/**
 * Demo fixtures are a local design aid, never a production fallback. Kept in a
 * dependency-light module so public, cacheable routes do not import `next/headers`
 * through the session helper and silently become dynamic.
 */
export function isDemoEnvironment(): boolean {
  if (isDatabaseConfigured() && hasSupabaseEnv()) return false
  return process.env.NODE_ENV !== 'production'
}
