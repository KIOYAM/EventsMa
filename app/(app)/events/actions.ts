'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  clients,
  eventStaff,
  eventTasks,
  eventVendors,
  events,
} from '@/lib/db/schema'
import { EVENT_STATUSES, TASK_STATUSES, type EventStatus, type TaskStatus } from '@/lib/domain/ops'
import { parseRupees } from '@/lib/domain/money'

const DATE = /^\d{4}-\d{2}-\d{2}$/

const isEventStatus = (value: string): value is EventStatus =>
  EVENT_STATUSES.some((status) => status === value)
const isTaskStatus = (value: string): value is TaskStatus =>
  TASK_STATUSES.some((status) => status === value)

function field(formData: FormData, key: string, max = 160): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

/** Create the client only when there is a real name; phone is the dedupe key. */
async function resolveClient(
  orgId: string,
  formData: FormData,
): Promise<string | null> {
  const db = getDb()
  const chosen = field(formData, 'clientId', 64)
  if (chosen) {
    const [owned] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.orgId, orgId), eq(clients.id, chosen)))
      .limit(1)
    return owned?.id ?? null
  }

  const name = field(formData, 'clientName', 120)
  if (!name) return null

  const phone = field(formData, 'clientPhone', 24)
  const normalized = phone.replace(/\D/g, '').slice(-10)

  if (normalized) {
    const [existing] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.orgId, orgId), eq(clients.phoneNormalized, normalized)))
      .limit(1)
    if (existing) return existing.id
  }

  const [created] = await db
    .insert(clients)
    .values({
      orgId,
      name,
      phone: phone || null,
      phoneNormalized: normalized || null,
      source: 'manual',
    })
    .returning({ id: clients.id })

  return created?.id ?? null
}

export async function createEvent(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/events?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const eventDate = field(formData, 'eventDate', 10)
  if (!DATE.test(eventDate)) redirect('/events?error=date')

  const guests = Math.min(Math.max(Math.round(Number(formData.get('guests') ?? 0)), 0), 100_000)
  if (!Number.isFinite(guests)) redirect('/events?error=guests')

  const eventType = field(formData, 'eventType', 80)
  const clientName = field(formData, 'clientName', 120)
  const venueName = field(formData, 'venueName', 160)
  const statusRaw = field(formData, 'status', 20)
  const status = isEventStatus(statusRaw) ? statusRaw : 'enquiry'

  const db = getDb()
  const clientId = await resolveClient(ctx.orgId, formData)

  const title =
    field(formData, 'title', 160) ||
    `${clientName || 'New client'} — ${eventType || 'Event'}`

  const [created] = await db
    .insert(events)
    .values({
      orgId: ctx.orgId,
      clientId,
      title: title.slice(0, 160),
      eventType: eventType || null,
      eventDate,
      guests,
      venueName: venueName || null,
      venueAddress: field(formData, 'venueAddress', 240) || null,
      startTime: field(formData, 'startTime', 5) || null,
      endTime: field(formData, 'endTime', 5) || null,
      status,
      notes: field(formData, 'notes', 2000) || null,
    })
    .returning({ id: events.id })

  if (!created) redirect('/events?error=missing')

  revalidatePath('/events')
  revalidatePath('/dashboard')
  redirect(`/events/${created.id}`)
}

export async function updateEvent(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/events?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const id = field(formData, 'id', 64)
  const eventDate = field(formData, 'eventDate', 10)
  if (!id) redirect('/events?error=missing')
  if (!DATE.test(eventDate)) redirect(`/events/${id}/edit?error=date`)

  const guests = Math.min(Math.max(Math.round(Number(formData.get('guests') ?? 0)), 0), 100_000)
  if (!Number.isFinite(guests)) redirect(`/events/${id}/edit?error=guests`)

  const db = getDb()
  const [existing] = await db
    .select({ clientId: events.clientId, title: events.title })
    .from(events)
    .where(and(eq(events.orgId, ctx.orgId), eq(events.id, id)))
    .limit(1)
  if (!existing) redirect('/events?error=missing')

  const chosenClient = field(formData, 'clientId', 64)
  const newClientName = field(formData, 'clientName', 120)
  const resolvedClient =
    chosenClient || newClientName ? await resolveClient(ctx.orgId, formData) : null
  const clientId = resolvedClient ?? existing.clientId

  const statusRaw = field(formData, 'status', 20)
  const title = field(formData, 'title', 160) || existing.title

  await db
    .update(events)
    .set({
      clientId,
      title,
      eventType: field(formData, 'eventType', 80) || null,
      eventDate,
      guests,
      venueName: field(formData, 'venueName', 160) || null,
      venueAddress: field(formData, 'venueAddress', 240) || null,
      startTime: field(formData, 'startTime', 5) || null,
      endTime: field(formData, 'endTime', 5) || null,
      status: isEventStatus(statusRaw) ? statusRaw : undefined,
      notes: field(formData, 'notes', 2000) || null,
    })
    .where(and(eq(events.orgId, ctx.orgId), eq(events.id, id)))

  revalidatePath('/events')
  revalidatePath(`/events/${id}`)
  revalidatePath('/dashboard')
  redirect(`/events/${id}?saved=details`)
}

export async function updateEventStatus(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const id = field(formData, 'id', 64)
  const status = field(formData, 'status', 20)
  if (!id || !isEventStatus(status)) redirect('/events?error=invalid')

  await getDb()
    .update(events)
    .set({ status })
    .where(and(eq(events.orgId, ctx.orgId), eq(events.id, id)))

  revalidatePath('/events')
  revalidatePath(`/events/${id}`)
  revalidatePath('/dashboard')
  redirect(`/events/${id}?saved=status`)
}

export async function addEventTask(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const eventId = field(formData, 'eventId', 64)
  const title = field(formData, 'title', 160)
  if (!eventId || !title) redirect(`/events/${eventId}?tab=operations&error=task`)

  const dueOn = field(formData, 'dueOn', 10)

  await getDb().insert(eventTasks).values({
    orgId: ctx.orgId,
    eventId,
    title,
    ownerMembershipId: field(formData, 'ownerMembershipId', 64) || null,
    dueOn: DATE.test(dueOn) ? dueOn : null,
  })

  revalidatePath(`/events/${eventId}`)
  redirect(`/events/${eventId}?tab=operations&saved=task`)
}

export async function setTaskStatus(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const eventId = field(formData, 'eventId', 64)
  const taskId = field(formData, 'taskId', 64)
  const status = field(formData, 'status', 10)
  if (!eventId || !taskId || !isTaskStatus(status)) {
    redirect(`/events/${eventId}?tab=operations&error=task`)
  }

  await getDb()
    .update(eventTasks)
    .set({ status })
    .where(and(eq(eventTasks.orgId, ctx.orgId), eq(eventTasks.id, taskId)))

  revalidatePath(`/events/${eventId}`)
  redirect(`/events/${eventId}?tab=operations`)
}

export async function addEventVendor(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/events?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const eventId = field(formData, 'eventId', 64)
  const name = field(formData, 'name', 120)
  if (!eventId || !name) redirect(`/events/${eventId}?tab=operations&error=vendor`)

  const amountRaw = field(formData, 'amount', 20)
  const amountPaise = amountRaw ? parseRupees(amountRaw) : 0
  if (amountPaise === null) redirect(`/events/${eventId}?tab=operations&error=vendor`)

  await getDb().insert(eventVendors).values({
    orgId: ctx.orgId,
    eventId,
    name,
    category: field(formData, 'category', 60) || null,
    amountPaise: Math.max(0, amountPaise),
    note: field(formData, 'note', 240) || null,
  })

  revalidatePath(`/events/${eventId}`)
  redirect(`/events/${eventId}?tab=operations&saved=vendor`)
}

export async function assignCrew(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/events?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const eventId = field(formData, 'eventId', 64)
  const membershipId = field(formData, 'membershipId', 64)
  if (!eventId || !membershipId) redirect(`/events/${eventId}?tab=crew&error=crew`)

  await getDb()
    .insert(eventStaff)
    .values({
      orgId: ctx.orgId,
      eventId,
      membershipId,
      roleLabel: field(formData, 'roleLabel', 60) || null,
      shiftStart: field(formData, 'shiftStart', 5) || null,
      shiftEnd: field(formData, 'shiftEnd', 5) || null,
    })
    .onConflictDoNothing()

  revalidatePath(`/events/${eventId}`)
  redirect(`/events/${eventId}?tab=crew&saved=crew`)
}

export async function setCrewCheckIn(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (ctx.demo || !isDatabaseConfigured()) redirect('/events?error=demo')

  const eventId = field(formData, 'eventId', 64)
  const staffId = field(formData, 'staffId', 64)
  const checkedIn = formData.get('checkedIn') === '1'
  if (!eventId || !staffId) redirect(`/events/${eventId}?tab=crew&error=crew`)

  await getDb()
    .update(eventStaff)
    .set({ checkedInAt: checkedIn ? new Date() : null })
    .where(and(eq(eventStaff.orgId, ctx.orgId), eq(eventStaff.id, staffId)))

  revalidatePath(`/events/${eventId}`)
  redirect(`/events/${eventId}?tab=crew`)
}
