'use server'

import { eq, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { businessServices, businesses, memberships, organisations } from '@/lib/db/schema'
import { isKnownVertical } from '@/lib/domain/verticals'

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? '')
    .trim()
    .slice(0, max)
}

/** URL-safe, lowercase, no leading or trailing dash. Falls back to "workspace". */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'workspace'
  )
}

/** One slug per organisation. A second "Kannan Events" becomes kannan-events-2. */
async function availableSlug(base: string): Promise<string> {
  const db = getDb()
  const candidates = [base, `${base}-2`, `${base}-3`, `${base}-4`, `${base}-5`]
  const taken = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(inArray(organisations.slug, candidates))

  const used = new Set(taken.map((row) => row.slug))
  const free = candidates.find((candidate) => !used.has(candidate))
  // Ten organisations with the same name is enough; after that the slug gets unique.
  return free ?? `${base}-${Date.now().toString(36)}`
}

/**
 * Creates the tenant: one organisation, one business profile, the enabled service
 * verticals and an owner membership — inside one transaction, so a signed-in
 * account can never end up attached to a half-built workspace.
 */
export async function createWorkspace(formData: FormData): Promise<void> {
  if (!isDatabaseConfigured() || !hasSupabaseEnv()) redirect('/onboarding?error=offline')

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const name = text(formData, 'name', 120)
  const city = text(formData, 'city', 80)
  const phone = text(formData, 'phone', 24)
  const verticals = formData
    .getAll('vertical')
    .map((value) => String(value))
    .filter((value) => isKnownVertical(value))
    .slice(0, 6)

  if (name.length < 2) redirect('/onboarding?error=name')
  if (verticals.length === 0) redirect('/onboarding?error=service')

  const db = getDb()
  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1)

  // Already has a workspace: onboarding is not a second-org button.
  if (existing) redirect('/dashboard')

  const slug = await availableSlug(slugify(name))

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organisations)
      .values({ name, slug, plan: 'trial', status: 'active' })
      .returning({ id: organisations.id })

    if (!org) throw new Error('organisation insert returned no row')

    await tx.insert(businesses).values({
      orgId: org.id,
      name,
      city: city || null,
      phone: phone || null,
      email: user.email,
      published: false,
    })

    await tx.insert(businessServices).values(
      verticals.map((verticalKey, index) => ({
        orgId: org.id,
        verticalKey,
        enabled: true,
        sortOrder: index,
      })),
    )

    await tx.insert(memberships).values({
      orgId: org.id,
      userId: user.id,
      role: 'owner',
      email: user.email,
      displayName: user.email,
      status: 'active',
    })
  })

  redirect('/dashboard')
}
