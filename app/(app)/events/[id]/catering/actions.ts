'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { events, serviceItems } from '@/lib/db/schema'
import {
  cateringSessions,
  cateringSnapshots,
  categorySelectionRules,
  eventCateringSessions,
  menuCategories,
  sessionDietaryCounts,
  sessionMenuItems,
} from '@/lib/db/schema-catering'
import { validateSelection, type SelectionRule } from '@/lib/domain/catering'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function back(eventId: string, params: Record<string, string> = {}): string {
  const query = new URLSearchParams(params).toString()
  return `/events/${eventId}/catering${query ? `?${query}` : ''}`
}

/** Every write re-checks tenancy, the demo guard and the role. */
async function guard(): Promise<{ orgId: string; demo: boolean }> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return { orgId: '', demo: true }
  if (ctx.demo || !isDatabaseConfigured()) return { orgId: '', demo: true }
  return { orgId: ctx.orgId, demo: false }
}

async function ownEvent(orgId: string, eventId: string): Promise<boolean> {
  const db = getDb()
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.orgId, orgId), eq(events.id, eventId)))
    .limit(1)
  return Boolean(row)
}

export async function addEventSession(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const templateId = String(formData.get('templateId') ?? '')
  const guestCount = Math.max(0, Number.parseInt(String(formData.get('guestCount') ?? '0'), 10) || 0)
  const sessionDate = String(formData.get('sessionDate') ?? '').trim()

  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))
  if (!eventId) redirect('/events')
  if (!(await ownEvent(ctx.orgId, eventId))) redirect(back(eventId, { error: 'event' }))

  const db = getDb()

  // A session is copied from a template, then owned by the event: renaming or
  // deleting the template later must not rewrite this booking.
  let name = String(formData.get('name') ?? '').trim().slice(0, 80)
  let startTime: string | null = null
  let endTime: string | null = null

  if (templateId) {
    const [template] = await db
      .select({
        name: cateringSessions.name,
        startTime: cateringSessions.startTime,
        endTime: cateringSessions.endTime,
      })
      .from(cateringSessions)
      .where(and(eq(cateringSessions.orgId, ctx.orgId), eq(cateringSessions.id, templateId)))
      .limit(1)
    if (!template) redirect(back(eventId, { error: 'template' }))
    name = template.name
    startTime = template.startTime
    endTime = template.endTime
  }

  if (!name) redirect(back(eventId, { error: 'name' }))

  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(eventCateringSessions)
    .where(and(eq(eventCateringSessions.orgId, ctx.orgId), eq(eventCateringSessions.eventId, eventId)))

  await db.insert(eventCateringSessions).values({
    orgId: ctx.orgId,
    eventId,
    templateId: templateId || null,
    name,
    sessionDate: sessionDate || null,
    startTime,
    endTime,
    guestCount,
    sortOrder: count?.n ?? 0,
  })

  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'session' }))
}

export async function updateEventSession(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const id = String(formData.get('id') ?? '')
  const guestCount = Math.max(0, Number.parseInt(String(formData.get('guestCount') ?? '0'), 10) || 0)
  const status = String(formData.get('status') ?? 'planned')
  const sessionDate = String(formData.get('sessionDate') ?? '').trim()
  const startTime = String(formData.get('startTime') ?? '').trim()
  const endTime = String(formData.get('endTime') ?? '').trim()

  if (!['planned', 'confirmed', 'served', 'cancelled'].includes(status)) {
    redirect(back(eventId, { error: 'status' }))
  }
  if ((startTime && !TIME.test(startTime)) || (endTime && !TIME.test(endTime))) {
    redirect(back(eventId, { error: 'time' }))
  }
  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))

  const db = getDb()
  const [session] = await db
    .select({
      id: eventCateringSessions.id,
      name: eventCateringSessions.name,
      guestCount: eventCateringSessions.guestCount,
    })
    .from(eventCateringSessions)
    .where(
      and(
        eq(eventCateringSessions.orgId, ctx.orgId),
        eq(eventCateringSessions.eventId, eventId),
        eq(eventCateringSessions.id, id),
      ),
    )
    .limit(1)

  if (!session) redirect(back(eventId, { error: 'session' }))

  await db.transaction(async (tx) => {
    await tx
      .update(eventCateringSessions)
      .set({
        guestCount,
        status,
        sessionDate: sessionDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
      })
      .where(and(eq(eventCateringSessions.orgId, ctx.orgId), eq(eventCateringSessions.id, id)))

    // Confirmation freezes the session as it stands, so a later catalogue edit
    // cannot silently change what was agreed.
    if (status === 'confirmed') {
      const items = await tx
        .select({
          name: sessionMenuItems.nameSnapshot,
          unitClass: sessionMenuItems.unitClassSnapshot,
          unitPricePaise: sessionMenuItems.unitPricePaise,
          quantity: sessionMenuItems.quantity,
        })
        .from(sessionMenuItems)
        .where(
          and(
            eq(sessionMenuItems.orgId, ctx.orgId),
            eq(sessionMenuItems.eventSessionId, id),
          ),
        )

      await tx.insert(cateringSnapshots).values({
        orgId: ctx.orgId,
        eventId,
        reason: 'confirmed',
        payload: { session: { id, name: session.name, guestCount }, items },
      })
    }
  })

  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'session' }))
}

export async function removeEventSession(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const id = String(formData.get('id') ?? '')

  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))

  const db = getDb()
  await db
    .delete(eventCateringSessions)
    .where(
      and(
        eq(eventCateringSessions.orgId, ctx.orgId),
        eq(eventCateringSessions.eventId, eventId),
        eq(eventCateringSessions.id, id),
      ),
    )

  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'removed' }))
}

/**
 * Adds one dish to a session.
 *
 * The rule is read from the session's template at the moment of writing, and the
 * count includes what is already selected — so a maximum cannot be exceeded by
 * clicking quickly or by posting the form by hand.
 */
export async function addSessionItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const sessionId = String(formData.get('sessionId') ?? '')
  const itemId = String(formData.get('itemId') ?? '')
  const categoryId = String(formData.get('categoryId') ?? '')

  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))

  const db = getDb()

  const [session] = await db
    .select({
      id: eventCateringSessions.id,
      templateId: eventCateringSessions.templateId,
    })
    .from(eventCateringSessions)
    .where(
      and(
        eq(eventCateringSessions.orgId, ctx.orgId),
        eq(eventCateringSessions.eventId, eventId),
        eq(eventCateringSessions.id, sessionId),
      ),
    )
    .limit(1)

  if (!session) redirect(back(eventId, { error: 'session' }))

  const [item] = await db
    .select({
      id: serviceItems.id,
      name: serviceItems.name,
      pricePaise: serviceItems.pricePaise,
      unitClass: serviceItems.unitClass,
      unitLabel: serviceItems.unitLabel,
      dietary: serviceItems.dietary,
    })
    .from(serviceItems)
    .where(and(eq(serviceItems.orgId, ctx.orgId), eq(serviceItems.id, itemId)))
    .limit(1)

  const [category] = await db
    .select({ id: menuCategories.id, name: menuCategories.name })
    .from(menuCategories)
    .where(and(eq(menuCategories.orgId, ctx.orgId), eq(menuCategories.id, categoryId)))
    .limit(1)

  if (!item || !category) redirect(back(eventId, { error: 'item' }))

  const rule = await resolveRule(ctx.orgId, session.templateId, categoryId)
  const [existing] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sessionMenuItems)
    .where(
      and(
        eq(sessionMenuItems.orgId, ctx.orgId),
        eq(sessionMenuItems.eventSessionId, sessionId),
        eq(sessionMenuItems.categoryId, categoryId),
      ),
    )

  const verdict = validateSelection(rule, (existing?.n ?? 0) + 1)
  if (!verdict.ok) redirect(back(eventId, { error: 'rule', session: sessionId }))

  await db
    .insert(sessionMenuItems)
    .values({
      orgId: ctx.orgId,
      eventSessionId: sessionId,
      itemId: item.id,
      categoryId: category.id,
      nameSnapshot: item.name,
      unitSnapshot: item.unitLabel,
      unitPricePaise: item.pricePaise,
      unitClassSnapshot: item.unitClass,
      dietarySnapshot: item.dietary,
      quantity: 1,
    })
    .onConflictDoNothing()

  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'item', session: sessionId }))
}

export async function removeSessionItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const id = String(formData.get('id') ?? '')
  const sessionId = String(formData.get('sessionId') ?? '')
  const itemId = String(formData.get('itemId') ?? '')

  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))

  const db = getDb()
  const scope = id
    ? and(eq(sessionMenuItems.orgId, ctx.orgId), eq(sessionMenuItems.id, id))
    : and(
        eq(sessionMenuItems.orgId, ctx.orgId),
        eq(sessionMenuItems.eventSessionId, sessionId),
        eq(sessionMenuItems.itemId, itemId),
      )
  await db.delete(sessionMenuItems).where(scope)

  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'item' }))
}

export async function setSessionItemQuantity(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const id = String(formData.get('id') ?? '')
  const quantity = Math.max(1, Number.parseInt(String(formData.get('quantity') ?? '1'), 10) || 1)

  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))

  const db = getDb()
  await db
    .update(sessionMenuItems)
    .set({ quantity })
    .where(and(eq(sessionMenuItems.orgId, ctx.orgId), eq(sessionMenuItems.id, id)))

  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'quantity' }))
}

export async function setSessionDietaryCount(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const eventId = String(formData.get('eventId') ?? '')
  const sessionId = String(formData.get('sessionId') ?? '')
  const profileKey = String(formData.get('profileKey') ?? '').slice(0, 40)
  const count = Math.max(0, Number.parseInt(String(formData.get('count') ?? '0'), 10) || 0)

  if (!profileKey) redirect(back(eventId, { error: 'diet' }))
  if (!canManageCommercial(ctx.role)) redirect(back(eventId, { error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back(eventId, { error: 'demo' }))

  const db = getDb()
  await db
    .insert(sessionDietaryCounts)
    .values({ orgId: ctx.orgId, eventSessionId: sessionId, profileKey, count })
    .onConflictDoUpdate({
      target: [sessionDietaryCounts.eventSessionId, sessionDietaryCounts.profileKey],
      set: { count },
    })

  revalidatePath(`/events/${eventId}/catering`)
  redirect(back(eventId, { saved: 'diet' }))
}

/** A session without a template has no configured limits: unlimited, not zero. */
async function resolveRule(
  orgId: string,
  templateId: string | null,
  categoryId: string,
): Promise<SelectionRule> {
  if (!templateId) return { minSelections: 0, maxSelections: null, required: false }

  const db = getDb()
  const [row] = await db
    .select({
      minSelections: categorySelectionRules.minSelections,
      maxSelections: categorySelectionRules.maxSelections,
      required: categorySelectionRules.required,
    })
    .from(categorySelectionRules)
    .where(
      and(
        eq(categorySelectionRules.orgId, orgId),
        eq(categorySelectionRules.sessionId, templateId),
        eq(categorySelectionRules.categoryId, categoryId),
      ),
    )
    .limit(1)

  return row ?? { minSelections: 0, maxSelections: null, required: false }
}
