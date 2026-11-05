'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { clients, enquiries, events } from '@/lib/db/schema'
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/lib/domain/ops'

const DAY_MS = 86_400_000

function isStatus(value: string): value is EnquiryStatus {
  return ENQUIRY_STATUSES.some((status) => status === value)
}

export async function updateClient(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/clients?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/clients?error=demo')

  const id = String(formData.get('id') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 24)
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const source = String(formData.get('source') ?? '').trim().slice(0, 60)
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 2000)
  if (!id || !name) redirect(`/clients/${id}?error=name`)
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    redirect(`/clients/${id}?error=email`)
  }

  const normalized = phone.replace(/\D/g, '').slice(-10)

  try {
    await getDb()
      .update(clients)
      .set({
        name,
        phone: phone || null,
        phoneNormalized: normalized || null,
        email: email || null,
        source: source || null,
        notes: notes || null,
      })
      .where(and(eq(clients.orgId, ctx.orgId), eq(clients.id, id)))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      redirect(`/clients/${id}?error=phone`)
    }
    redirect(`/clients/${id}?error=missing`)
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  revalidatePath('/dashboard')
  redirect(`/clients/${id}?saved=details`)
}

export async function setEnquiryStatus(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/clients?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/clients?error=demo')

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !isStatus(status)) redirect('/clients?error=invalid')

  await getDb()
    .update(enquiries)
    .set({ status })
    .where(and(eq(enquiries.orgId, ctx.orgId), eq(enquiries.id, id)))

  revalidatePath('/clients')
  revalidatePath('/dashboard')
  redirect('/clients?saved=status')
}

/**
 * Conversion is one server action, not a wizard: create the event from what the
 * enquiry already knows, mark the enquiry won, and land on the run sheet.
 */
export async function convertEnquiryToEvent(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/clients?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/clients?error=demo')

  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/clients?error=invalid')

  const db = getDb()
  const [row] = await db
    .select({
      id: enquiries.id,
      clientId: enquiries.clientId,
      eventDate: enquiries.eventDate,
      guests: enquiries.guests,
      eventType: enquiries.eventType,
      message: enquiries.message,
      status: enquiries.status,
      clientName: clients.name,
    })
    .from(enquiries)
    .leftJoin(clients, eq(enquiries.clientId, clients.id))
    .where(and(eq(enquiries.orgId, ctx.orgId), eq(enquiries.id, id)))
    .limit(1)

  if (!row) redirect('/clients?error=missing')
  if (row.status === 'won') redirect('/clients?error=already')

  const eventDate =
    row.eventDate ?? new Date(Date.now() + 30 * DAY_MS).toISOString().slice(0, 10)
  const label = row.eventType ?? 'Event'
  const title = `${row.clientName ?? 'New client'} — ${label}`

  const [created] = await db
    .insert(events)
    .values({
      orgId: ctx.orgId,
      clientId: row.clientId,
      enquiryId: row.id,
      title: title.slice(0, 160),
      eventType: row.eventType,
      eventDate,
      guests: row.guests,
      notes: row.message,
      status: 'tentative',
    })
    .returning({ id: events.id })

  if (!created) redirect('/clients?error=missing')

  await db
    .update(enquiries)
    .set({ status: 'won' })
    .where(and(eq(enquiries.orgId, ctx.orgId), eq(enquiries.id, id)))

  revalidatePath('/clients')
  revalidatePath('/events')
  revalidatePath('/dashboard')
  redirect(`/events/${created.id}`)
}
