'use server'

import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { businessServices } from '@/lib/db/schema'
import {
  cateringSessions,
  categorySelectionRules,
  dietaryProfiles,
  menuCategories,
} from '@/lib/db/schema-catering'
import { CATERING_VERTICAL } from '@/lib/db/catering'

function back(params: Record<string, string>): string {
  return `/catering?${new URLSearchParams(params).toString()}`
}

const STARTER_SESSIONS = [
  { name: 'Breakfast', startTime: '07:00', endTime: '09:30', minGuests: 25 },
  { name: 'Lunch', startTime: '12:00', endTime: '14:30', minGuests: 50 },
  { name: 'Evening snacks', startTime: '16:30', endTime: '17:30', minGuests: 25 },
  { name: 'Dinner', startTime: '19:00', endTime: '22:00', minGuests: 50 },
] as const

const STARTER_CATEGORIES = [
  { name: 'Welcome drinks', min: 0, max: 2, required: false },
  { name: 'Starters', min: 2, max: 4, required: true },
  { name: 'Main course', min: 2, max: 5, required: true },
  { name: 'Rice & breads', min: 1, max: 3, required: false },
  { name: 'Desserts', min: 1, max: 3, required: false },
  { name: 'Beverages', min: 0, max: null, required: false },
  { name: 'Live counters', min: 0, max: 3, required: false },
] as const

const STARTER_DIETS = [
  { key: 'veg', label: 'Vegetarian', isAllergen: false },
  { key: 'non_veg', label: 'Non-vegetarian', isAllergen: false },
  { key: 'vegan', label: 'Vegan', isAllergen: false },
  { key: 'jain', label: 'Jain', isAllergen: false },
  { key: 'no_onion_garlic', label: 'No onion or garlic', isAllergen: false },
  { key: 'nut_allergy', label: 'Nut allergy', isAllergen: true },
] as const

/** Idempotent: enables the vertical and fills in whatever is missing. */
export async function adoptCatering(): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()

  await db
    .insert(businessServices)
    .values({ orgId: ctx.orgId, verticalKey: CATERING_VERTICAL, enabled: true })
    .onConflictDoUpdate({
      target: [businessServices.orgId, businessServices.verticalKey],
      set: { enabled: true },
    })

  await seedCateringConfig(ctx.orgId)

  revalidatePath('/catering')
  revalidatePath('/')
  redirect(back({ saved: 'adopted' }))
}

export async function seedCateringConfigAction(): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  await seedCateringConfig(ctx.orgId)
  revalidatePath('/catering')
  redirect(back({ saved: 'seeded' }))
}

/** Transactional so a half-seeded set never reaches the UI. */
async function seedCateringConfig(orgId: string): Promise<void> {
  const db = getDb()

  await db.transaction(async (tx) => {
    const existingSessions = await tx
      .select({ name: cateringSessions.name })
      .from(cateringSessions)
      .where(eq(cateringSessions.orgId, orgId))
    const haveSession = new Set(existingSessions.map((row) => row.name))

    for (const [index, session] of STARTER_SESSIONS.entries()) {
      if (haveSession.has(session.name)) continue
      await tx.insert(cateringSessions).values({
        orgId,
        name: session.name,
        startTime: session.startTime,
        endTime: session.endTime,
        minGuests: session.minGuests,
        cutoffHours: 48,
        sortOrder: index,
      })
    }

    const existingCategories = await tx
      .select({ id: menuCategories.id, name: menuCategories.name })
      .from(menuCategories)
      .where(eq(menuCategories.orgId, orgId))
    const categoryByName = new Map(existingCategories.map((row) => [row.name, row.id]))

    for (const [index, category] of STARTER_CATEGORIES.entries()) {
      if (categoryByName.has(category.name)) continue
      const [row] = await tx
        .insert(menuCategories)
        .values({ orgId, name: category.name, sortOrder: index })
        .returning({ id: menuCategories.id })
      if (row) categoryByName.set(category.name, row.id)
    }

    const existingDiets = await tx
      .select({ key: dietaryProfiles.key })
      .from(dietaryProfiles)
      .where(eq(dietaryProfiles.orgId, orgId))
    const haveDiet = new Set(existingDiets.map((row) => row.key))

    for (const [index, diet] of STARTER_DIETS.entries()) {
      if (haveDiet.has(diet.key)) continue
      await tx.insert(dietaryProfiles).values({
        orgId,
        key: diet.key,
        label: diet.label,
        isAllergen: diet.isAllergen,
        sortOrder: index,
      })
    }

    const sessions = await tx
      .select({ id: cateringSessions.id })
      .from(cateringSessions)
      .where(and(eq(cateringSessions.orgId, orgId), eq(cateringSessions.active, true)))
      .orderBy(asc(cateringSessions.sortOrder))

    if (sessions.length === 0) return

    const existingRules = await tx
      .select({
        sessionId: categorySelectionRules.sessionId,
        categoryId: categorySelectionRules.categoryId,
      })
      .from(categorySelectionRules)
      .where(eq(categorySelectionRules.orgId, orgId))
    const haveRule = new Set(existingRules.map((row) => `${row.sessionId}:${row.categoryId}`))

    for (const session of sessions) {
      for (const [index, category] of STARTER_CATEGORIES.entries()) {
        const categoryId = categoryByName.get(category.name)
        if (!categoryId || haveRule.has(`${session.id}:${categoryId}`)) continue
        await tx.insert(categorySelectionRules).values({
          orgId,
          sessionId: session.id,
          categoryId,
          minSelections: category.min,
          maxSelections: category.max,
          required: category.required,
          sortOrder: index,
        })
      }
    }
  })
}
