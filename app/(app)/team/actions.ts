'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { invitations, memberships } from '@/lib/db/schema'

const ROLES = ['owner', 'manager', 'employee'] as const
type Role = (typeof ROLES)[number]

const isRole = (value: string): value is Role => ROLES.some((role) => role === value)

export async function inviteMember(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.role !== 'owner') redirect('/team?error=permission')

  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const roleRaw = String(formData.get('role') ?? 'employee')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !isRole(roleRaw)) {
    redirect('/team?error=email')
  }
  if (ctx.demo || !isDatabaseConfigured()) redirect('/team?error=demo')

  const db = getDb()
  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.orgId, ctx.orgId), eq(memberships.email, email)))
    .limit(1)

  if (existing) redirect('/team?error=already')

  await db.insert(invitations).values({
    orgId: ctx.orgId,
    email,
    role: roleRaw,
    token: randomUUID(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  revalidatePath('/team')
  redirect('/team?invited=1')
}

export async function updateMemberRole(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.role !== 'owner') redirect('/team?error=permission')

  const membershipId = String(formData.get('membershipId') ?? '')
  const roleRaw = String(formData.get('role') ?? '')
  if (!membershipId || !isRole(roleRaw)) redirect('/team?error=role')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/team?error=demo')

  const db = getDb()
  const [target] = await db
    .select({ id: memberships.id, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, ctx.orgId), eq(memberships.id, membershipId)))
    .limit(1)

  if (!target) redirect('/team?error=missing')

  // A workspace must keep at least one owner; otherwise nobody can ever
  // change a role, invite anyone or close the account again.
  if (target.role === 'owner' && roleRaw !== 'owner') {
    const [owners] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(memberships)
      .where(
        and(
          eq(memberships.orgId, ctx.orgId),
          eq(memberships.role, 'owner'),
          eq(memberships.status, 'active'),
        ),
      )
    if ((owners?.n ?? 0) <= 1) redirect('/team?error=last_owner')
  }

  await db
    .update(memberships)
    .set({ role: roleRaw })
    .where(and(eq(memberships.orgId, ctx.orgId), eq(memberships.id, membershipId)))

  revalidatePath('/team')
  redirect('/team?saved=role')
}

export async function setMemberActive(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.role !== 'owner') redirect('/team?error=permission')

  const membershipId = String(formData.get('membershipId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!membershipId || !['active', 'inactive'].includes(status)) redirect('/team?error=role')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/team?error=demo')

  const db = getDb()
  const [target] = await db
    .select({ id: memberships.id, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, ctx.orgId), eq(memberships.id, membershipId)))
    .limit(1)

  if (!target) redirect('/team?error=missing')
  if (target.role === 'owner' && status === 'inactive') {
    const [owners] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(memberships)
      .where(
        and(
          eq(memberships.orgId, ctx.orgId),
          eq(memberships.role, 'owner'),
          eq(memberships.status, 'active'),
        ),
      )
    if ((owners?.n ?? 0) <= 1) redirect('/team?error=last_owner')
  }

  await db
    .update(memberships)
    .set({ status })
    .where(and(eq(memberships.orgId, ctx.orgId), eq(memberships.id, membershipId)))

  revalidatePath('/team')
  redirect('/team?saved=status')
}
