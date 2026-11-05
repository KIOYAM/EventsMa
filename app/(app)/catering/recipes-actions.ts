'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { serviceItems } from '@/lib/db/schema'
import { menuCategories, menuItemCategories, menuItemIngredients } from '@/lib/db/schema-catering'
import { isIngredientUnit } from '@/lib/domain/catering'

function back(params: Record<string, string>): string {
  return `/catering/recipes?${new URLSearchParams(params).toString()}`
}

async function editable(): Promise<{ orgId: string } | { error: 'permission' | 'demo' }> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return { error: 'permission' }
  if (ctx.demo || !isDatabaseConfigured()) return { error: 'demo' }
  return { orgId: ctx.orgId }
}

async function ownsDish(orgId: string, itemId: string): Promise<boolean> {
  const db = getDb()
  const [row] = await db
    .select({ id: serviceItems.id })
    .from(serviceItems)
    .where(and(eq(serviceItems.orgId, orgId), eq(serviceItems.id, itemId)))
    .limit(1)
  return Boolean(row)
}

export async function assignDishCategory(formData: FormData): Promise<void> {
  const gate = await editable()
  if ('error' in gate) redirect(back({ error: gate.error }))

  const itemId = String(formData.get('itemId') ?? '')
  const categoryId = String(formData.get('categoryId') ?? '')
  if (!itemId || !categoryId) redirect(back({ error: 'assign' }))
  if (!(await ownsDish(gate.orgId, itemId))) redirect(back({ error: 'assign' }))

  const db = getDb()
  const [category] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(and(eq(menuCategories.orgId, gate.orgId), eq(menuCategories.id, categoryId)))
    .limit(1)
  if (!category) redirect(back({ error: 'assign' }))

  await db
    .insert(menuItemCategories)
    .values({ orgId: gate.orgId, itemId, categoryId })
    .onConflictDoNothing()

  revalidatePath('/catering/recipes')
  revalidatePath('/catering')
  redirect(back({ saved: 'assigned' }))
}

export async function unassignDishCategory(formData: FormData): Promise<void> {
  const gate = await editable()
  if ('error' in gate) redirect(back({ error: gate.error }))

  const itemId = String(formData.get('itemId') ?? '')
  const categoryId = String(formData.get('categoryId') ?? '')

  const db = getDb()
  await db
    .delete(menuItemCategories)
    .where(
      and(
        eq(menuItemCategories.orgId, gate.orgId),
        eq(menuItemCategories.itemId, itemId),
        eq(menuItemCategories.categoryId, categoryId),
      ),
    )

  revalidatePath('/catering/recipes')
  revalidatePath('/catering')
  redirect(back({ saved: 'assigned' }))
}

/**
 * Quantity is entered in whole grams / millilitres / pieces and stored in
 * thousandths, so 0.18 kg of rice becomes 180 g without a float anywhere.
 */
export async function addRecipeIngredient(formData: FormData): Promise<void> {
  const gate = await editable()
  if ('error' in gate) redirect(back({ error: gate.error }))

  const itemId = String(formData.get('itemId') ?? '')
  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const unitRaw = String(formData.get('unit') ?? 'g')
  const perServing = Number.parseFloat(String(formData.get('perServing') ?? ''))
  const wastagePct = Number.parseFloat(String(formData.get('wastagePct') ?? '0') || '0')

  if (!name || !Number.isFinite(perServing) || perServing <= 0 || perServing > 100_000) {
    redirect(back({ error: 'recipe' }))
  }
  if (!isIngredientUnit(unitRaw)) redirect(back({ error: 'recipe' }))
  if (!Number.isFinite(wastagePct) || wastagePct < 0 || wastagePct > 50) {
    redirect(back({ error: 'recipe' }))
  }
  if (!(await ownsDish(gate.orgId, itemId))) redirect(back({ error: 'recipe' }))

  const db = getDb()
  await db.insert(menuItemIngredients).values({
    orgId: gate.orgId,
    itemId,
    name,
    unit: unitRaw,
    quantityMilliPerServing: Math.round(perServing * 1000),
    wastageBp: Math.round(wastagePct * 100),
  })

  revalidatePath('/catering/recipes')
  redirect(back({ saved: 'recipe' }))
}

export async function removeRecipeIngredient(formData: FormData): Promise<void> {
  const gate = await editable()
  if ('error' in gate) redirect(back({ error: gate.error }))

  const id = String(formData.get('id') ?? '')
  const db = getDb()
  await db
    .delete(menuItemIngredients)
    .where(and(eq(menuItemIngredients.orgId, gate.orgId), eq(menuItemIngredients.id, id)))

  revalidatePath('/catering/recipes')
  redirect(back({ saved: 'recipe' }))
}
