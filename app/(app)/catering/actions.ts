'use server'

import { and, asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  cateringSessions,
  categorySelectionRules,
  dietaryProfiles,
  menuCategories,
} from '@/lib/db/schema-catering'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function back(params: Record<string, string>): string {
  return `/catering?${new URLSearchParams(params).toString()}`
}

function intOrNull(value: FormDataEntryValue | null, max = 1_000_000): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return n
}

/**
 * The starter set an owner edits, not a fixed taxonomy.
 *
 * Four sessions and seven categories cover a South Indian function without
 * pretending to be the only way to cater; every row is renameable, reorderable
 * and removable.
 */
export async function createCateringSession(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const name = String(formData.get('name') ?? '').trim().slice(0, 80)
  const startTime = String(formData.get('startTime') ?? '').trim()
  const endTime = String(formData.get('endTime') ?? '').trim()
  const minGuests = intOrNull(formData.get('minGuests'))
  const maxGuests = intOrNull(formData.get('maxGuests'))
  const cutoffHours = intOrNull(formData.get('cutoffHours'), 720)

  if (!name) redirect(back({ error: 'name' }))
  if ((startTime && !TIME.test(startTime)) || (endTime && !TIME.test(endTime))) {
    redirect(back({ error: 'time' }))
  }
  if (minGuests !== null && maxGuests !== null && maxGuests < minGuests) {
    redirect(back({ error: 'guests' }))
  }
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  const [dup] = await db
    .select({ id: cateringSessions.id })
    .from(cateringSessions)
    .where(and(eq(cateringSessions.orgId, ctx.orgId), eq(cateringSessions.name, name)))
    .limit(1)
  if (dup) redirect(back({ error: 'duplicate' }))

  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(cateringSessions)
    .where(eq(cateringSessions.orgId, ctx.orgId))

  await db.insert(cateringSessions).values({
    orgId: ctx.orgId,
    name,
    startTime: startTime || null,
    endTime: endTime || null,
    minGuests,
    maxGuests,
    cutoffHours,
    sortOrder: count?.n ?? 0,
  })

  revalidatePath('/catering')
  redirect(back({ saved: 'session' }))
}

export async function setCateringSessionActive(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'

  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  await db
    .update(cateringSessions)
    .set({ active })
    .where(and(eq(cateringSessions.orgId, ctx.orgId), eq(cateringSessions.id, id)))

  revalidatePath('/catering')
  redirect(back({ saved: 'session' }))
}

/** Moves a session one place up or down inside the owner's own order. */
export async function moveCateringSession(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const id = String(formData.get('id') ?? '')
  const direction = String(formData.get('direction') ?? '') === 'up' ? -1 : 1

  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  const rows = await db
    .select({ id: cateringSessions.id, sortOrder: cateringSessions.sortOrder })
    .from(cateringSessions)
    .where(eq(cateringSessions.orgId, ctx.orgId))
    .orderBy(asc(cateringSessions.sortOrder), asc(cateringSessions.name))

  const index = rows.findIndex((row) => row.id === id)
  const current = rows[index]
  const neighbour = rows[index + direction]
  if (!current || !neighbour) redirect(back({ saved: 'session' }))

  await db.transaction(async (tx) => {
    await tx
      .update(cateringSessions)
      .set({ sortOrder: neighbour.sortOrder })
      .where(and(eq(cateringSessions.orgId, ctx.orgId), eq(cateringSessions.id, current.id)))
    await tx
      .update(cateringSessions)
      .set({ sortOrder: current.sortOrder })
      .where(and(eq(cateringSessions.orgId, ctx.orgId), eq(cateringSessions.id, neighbour.id)))
  })

  revalidatePath('/catering')
  redirect(back({ saved: 'session' }))
}

export async function createMenuCategory(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const name = String(formData.get('name') ?? '').trim().slice(0, 80)
  const description = String(formData.get('description') ?? '').trim().slice(0, 240)

  if (!name) redirect(back({ error: 'name' }))
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  const [dup] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(and(eq(menuCategories.orgId, ctx.orgId), eq(menuCategories.name, name)))
    .limit(1)
  if (dup) redirect(back({ error: 'duplicate' }))

  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(menuCategories)
    .where(eq(menuCategories.orgId, ctx.orgId))

  await db.insert(menuCategories).values({
    orgId: ctx.orgId,
    name,
    description: description || null,
    sortOrder: count?.n ?? 0,
  })

  revalidatePath('/catering')
  redirect(back({ saved: 'category' }))
}

export async function setMenuCategoryActive(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'

  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  await db
    .update(menuCategories)
    .set({ active })
    .where(and(eq(menuCategories.orgId, ctx.orgId), eq(menuCategories.id, id)))

  revalidatePath('/catering')
  redirect(back({ saved: 'category' }))
}

/**
 * Saves one rule from the matrix. A blank maximum means unlimited, which is a
 * different intent from zero and must survive the round trip as null.
 */
export async function saveSelectionRule(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const sessionId = String(formData.get('sessionId') ?? '')
  const categoryId = String(formData.get('categoryId') ?? '')
  const minRaw = String(formData.get('minSelections') ?? '0').trim()
  const maxRaw = String(formData.get('maxSelections') ?? '').trim()
  const required = String(formData.get('required') ?? '') === 'on'
  const pricingMode = ['per_guest', 'per_unit', 'flat'].includes(String(formData.get('pricingMode')))
    ? String(formData.get('pricingMode'))
    : 'per_guest'
  const selectedSession = String(formData.get('selectedSession') ?? '')

  const min = Number.parseInt(minRaw, 10)
  const max = maxRaw === '' ? null : Number.parseInt(maxRaw, 10)

  if (!Number.isFinite(min) || min < 0 || min > 99) redirect(back({ error: 'rule', session: selectedSession }))
  if (max !== null && (!Number.isFinite(max) || max < min || max > 99)) {
    redirect(back({ error: 'rule', session: selectedSession }))
  }

  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission', session: selectedSession }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo', session: selectedSession }))

  const db = getDb()

  // Both ends of the relationship must belong to this tenant.
  const [session] = await db
    .select({ id: cateringSessions.id })
    .from(cateringSessions)
    .where(and(eq(cateringSessions.orgId, ctx.orgId), eq(cateringSessions.id, sessionId)))
    .limit(1)
  const [category] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(and(eq(menuCategories.orgId, ctx.orgId), eq(menuCategories.id, categoryId)))
    .limit(1)

  if (!session || !category) redirect(back({ error: 'rule', session: selectedSession }))

  await db
    .insert(categorySelectionRules)
    .values({
      orgId: ctx.orgId,
      sessionId,
      categoryId,
      minSelections: min,
      maxSelections: max,
      required,
      pricingMode,
    })
    .onConflictDoUpdate({
      target: [categorySelectionRules.sessionId, categorySelectionRules.categoryId],
      set: { minSelections: min, maxSelections: max, required, pricingMode },
    })

  revalidatePath('/catering')
  redirect(back({ saved: 'rule', session: selectedSession }))
}

export async function createDietaryProfile(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const label = String(formData.get('label') ?? '').trim().slice(0, 60)
  const isAllergen = String(formData.get('isAllergen') ?? '') === 'on'
  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)

  if (!label || !key) redirect(back({ error: 'name' }))
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  const [dup] = await db
    .select({ id: dietaryProfiles.id })
    .from(dietaryProfiles)
    .where(and(eq(dietaryProfiles.orgId, ctx.orgId), eq(dietaryProfiles.key, key)))
    .limit(1)
  if (dup) redirect(back({ error: 'duplicate' }))

  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(dietaryProfiles)
    .where(eq(dietaryProfiles.orgId, ctx.orgId))

  await db.insert(dietaryProfiles).values({
    orgId: ctx.orgId,
    key,
    label,
    isAllergen,
    sortOrder: count?.n ?? 0,
  })

  revalidatePath('/catering')
  redirect(back({ saved: 'diet' }))
}
