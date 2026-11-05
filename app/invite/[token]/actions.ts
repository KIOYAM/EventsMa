'use server'

import { and, eq, gt, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { auditEvents, invitations, memberships } from '@/lib/db/schema'

function field(formData: FormData, key: string, max = 200): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

export async function acceptInvitation(formData: FormData): Promise<void> {
  const token = field(formData, 'token', 120)
  const back = `/invite/${encodeURIComponent(token)}`
  if (!token) redirect('/login?error=link')
  if (!isDatabaseConfigured()) redirect(`${back}?error=demo`)

  const user = await getCurrentUser()
  if (!user?.email) redirect(`/login?next=${encodeURIComponent(back)}`)

  const db = getDb()
  const [invite] = await db
    .select({
      id: invitations.id,
      orgId: invitations.orgId,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!invite) redirect(`${back}?error=expired`)
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    redirect(`${back}?error=account`)
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(memberships)
      .values({
        orgId: invite.orgId,
        userId: user.id,
        email: user.email,
        displayName: user.email?.split('@')[0] ?? null,
        role: invite.role,
        status: 'active',
      })
      .onConflictDoNothing()

    await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invitations.id, invite.id), isNull(invitations.acceptedAt)))

    await tx.insert(auditEvents).values({
      orgId: invite.orgId,
      actorId: user.id,
      action: 'team.invitation_accepted',
      entity: 'invitation',
      entityId: invite.id,
      after: { email: invite.email, role: invite.role },
    })
  })

  revalidatePath('/team')
  redirect('/dashboard?joined=1')
}
