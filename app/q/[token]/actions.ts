'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { auditEvents, quotations } from '@/lib/db/schema'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function field(formData: FormData, key: string, max = 200): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

/**
 * Public acceptance is the one write a customer may make without an account.
 * It is narrow on purpose: the token proves access, the status transition is
 * checked in SQL, and the quotation version itself is never touched.
 */
export async function acceptQuote(formData: FormData): Promise<void> {
  const token = field(formData, 'token', 120)
  const email = field(formData, 'email', 200).toLowerCase()
  const back = `/q/${encodeURIComponent(token)}`

  if (!token || formData.get('accepted') !== 'yes') redirect(`${back}?error=confirm`)
  if (email && !EMAIL.test(email)) redirect(`${back}?error=email`)
  if (!isDatabaseConfigured()) redirect(`${back}?error=demo`)

  const db = getDb()
  const [quote] = await db
    .select({
      id: quotations.id,
      orgId: quotations.orgId,
      status: quotations.status,
      tokenExpiresAt: quotations.tokenExpiresAt,
    })
    .from(quotations)
    .where(eq(quotations.publicToken, token))
    .limit(1)

  if (!quote) redirect(`${back}?error=missing`)
  if (quote.status === 'accepted') redirect(`${back}?accepted=1`)
  if (quote.status !== 'sent' && quote.status !== 'viewed') {
    redirect(`${back}?error=closed`)
  }
  if (quote.tokenExpiresAt && quote.tokenExpiresAt.getTime() < Date.now()) {
    redirect(`${back}?error=expired`)
  }

  const updated = await db
    .update(quotations)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedByEmail: email || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(quotations.id, quote.id),
        eq(quotations.orgId, quote.orgId),
        inArray(quotations.status, ['sent', 'viewed']),
      ),
    )
    .returning({ id: quotations.id, acceptedAt: quotations.acceptedAt })

  if (!updated[0]) redirect(`${back}?error=closed`)

  // The audit row is best effort: a failed audit insert must not make the
  // customer's acceptance look unsuccessful.
  try {
    await db.insert(auditEvents).values({
      orgId: quote.orgId,
      action: 'quote.accepted',
      entity: 'quotation',
      entityId: quote.id,
      after: { acceptedByEmail: email || null, acceptedAt: updated[0].acceptedAt?.toISOString() },
    })
  } catch {
    // ignored on purpose
  }

  revalidatePath('/quotes')
  revalidatePath('/dashboard')
  revalidatePath(back)
  redirect(`${back}?accepted=1`)
}
