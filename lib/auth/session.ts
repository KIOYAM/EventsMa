import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { memberships } from '@/lib/db/schema'
import { DEMO_ORG_ID } from '@/lib/demo/data'

export type WorkspaceRole = 'owner' | 'manager' | 'employee'

export interface WorkspaceContext {
  userId: string
  email: string | null
  orgId: string
  role: WorkspaceRole
  demo: boolean
  /** The membership row, so field screens can show only what this person owns. */
  membershipId: string
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/** True when the app is reviewable but not connected to a database. */
export function isDemoEnvironment(): boolean {
  return !isDatabaseConfigured() || !hasSupabaseEnv()
}

export async function getSupabaseServerClient() {
  if (!hasSupabaseEnv()) return null

  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items: { name: string; value: string; options?: CookieOptions }[]) => {
          try {
            for (const { name, value, options } of items) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component render; the middleware refreshes instead.
          }
        },
      },
    },
  )
}

export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}

/**
 * The single entry point for authenticated pages and server actions.
 * The database policy is still the authority; this only decides what to render.
 */
export async function requireWorkspace(): Promise<WorkspaceContext> {
  if (isDemoEnvironment()) {
    return {
      userId: '00000000-0000-4000-8000-0000000000ff',
      email: 'demo@eventsma.in',
      orgId: DEMO_ORG_ID,
      role: 'owner',
      demo: true,
      membershipId: '00000000-0000-4000-8000-0000000000b1',
    }
  }

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()
  const [row] = await db
    .select({ id: memberships.id, orgId: memberships.orgId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1)

  if (!row) {
    // Signed in but not yet attached to an organisation.
    redirect('/onboarding')
  }

  return {
    userId: user.id,
    email: user.email,
    orgId: row.orgId,
    role: row.role as WorkspaceRole,
    demo: false,
    membershipId: row.id,
  }
}

/** Owners and managers may touch money. The database enforces this too. */
export function canManageCommercial(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'manager'
}
