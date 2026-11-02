'use server'

import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { clients, enquiries, notifications, organisations } from '@/lib/db/schema'

function normalisePhone(value: string): string {
  return value.replace(/\D/g, '').slice(-10)
}

/**
 * Public, unauthenticated enquiry intake.
 *
 * The organisation is resolved from the slug on the server — never from the form.
 * Rows are written with that org_id only. No pricing or customer data is returned.
 */
export async function submitEnquiry(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').slice(0, 80)
  const back = `/p/${encodeURIComponent(slug)}`
  if (!slug) redirect('/')

  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 20)
  const guests = Math.max(0, Math.min(100_000, Number(formData.get('guests') ?? 0) || 0))
  const eventDate = String(formData.get('eventDate') ?? '').slice(0, 10)
  const message = String(formData.get('message') ?? '').trim().slice(0, 1000)
  const eventType = String(formData.get('eventType') ?? '').trim().slice(0, 60)

  if (!name || normalisePhone(phone).length < 10) {
    redirect(`${back}?error=contact`)
  }

  if (!isDatabaseConfigured()) {
    redirect(`${back}?error=demo`)
  }

  const db = getDb()

  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.slug, slug))
    .limit(1)

  if (!org) redirect(`${back}?error=notfound`)

  const phoneNormalized = normalisePhone(phone)

  const [existingClient] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.orgId, org.id), eq(clients.phoneNormalized, phoneNormalized)))
    .limit(1)

  let clientId = existingClient?.id

  if (!clientId) {
    const [created] = await db
      .insert(clients)
      .values({
        orgId: org.id,
        name,
        phone,
        phoneNormalized,
        source: 'public page',
      })
      .returning({ id: clients.id })
    clientId = created?.id
  }

  const [enquiry] = await db
    .insert(enquiries)
    .values({
      orgId: org.id,
      clientId: clientId ?? null,
      eventDate: eventDate || null,
      guests,
      eventType: eventType || null,
      message: message || null,
      status: 'new',
      source: 'public page',
      nextFollowUpAt: new Date(Date.now() + 86_400_000),
    })
    .returning({ id: enquiries.id })

  if (enquiry) {
    // Queued here; the email/WhatsApp worker drains this table.
    await db.insert(notifications).values({
      orgId: org.id,
      kind: 'enquiry.new',
      channel: 'email',
      status: 'queued',
      payload: { enquiryId: enquiry.id, guests, eventDate, eventType },
    })
  }

  redirect(`${back}?sent=1`)
}
