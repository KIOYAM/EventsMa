'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { inventoryItems, inventoryMovements } from '@/lib/db/schema'
import { parseRupees } from '@/lib/domain/money'

const UNITS = ['kg', 'ltr', 'pcs', 'dozen', 'pack'] as const
const REASONS = ['opening', 'purchase', 'consumption', 'wastage', 'correction'] as const

/** Quantity entered as a decimal string, stored as signed thousandths. */
function toMilli(raw: string): number | null {
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  const milli = Math.round(value * 1000)
  if (!Number.isSafeInteger(milli)) return null
  return milli
}

export async function createInventoryItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const unitRaw = String(formData.get('unit') ?? 'kg')
  const unit = UNITS.find((candidate) => candidate === unitRaw) ?? 'kg'
  const opening = toMilli(String(formData.get('opening') ?? '0'))
  const reorder = toMilli(String(formData.get('reorder') ?? '0'))
  const costRaw = String(formData.get('cost') ?? '').trim()
  const costPaise = costRaw ? parseRupees(costRaw) : null
  const supplier = String(formData.get('supplier') ?? '').trim().slice(0, 120)

  if (!name || opening === null || reorder === null) redirect('/inventory?error=invalid')
  if (costRaw && costPaise === null) redirect('/inventory?error=invalid')
  if (!canManageCommercial(ctx.role)) redirect('/inventory?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/inventory?error=demo')

  const db = getDb()
  const [item] = await db
    .insert(inventoryItems)
    .values({
      orgId: ctx.orgId,
      name,
      unit,
      reorderLevelMilli: Math.max(0, reorder),
      costPaisePerUnit: costPaise ?? null,
      supplier: supplier || null,
    })
    .returning({ id: inventoryItems.id })

  // Opening stock is a movement like any other, so on-hand is always a sum.
  if (item && opening !== 0) {
    await db.insert(inventoryMovements).values({
      orgId: ctx.orgId,
      itemId: item.id,
      deltaMilli: opening,
      reason: 'opening',
      note: 'Opening stock',
    })
  }

  revalidatePath('/inventory')
  redirect('/inventory?saved=item')
}

export async function recordInventoryMovement(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const itemId = String(formData.get('itemId') ?? '')
  const reasonRaw = String(formData.get('reason') ?? 'purchase')
  const reason = REASONS.find((candidate) => candidate === reasonRaw) ?? 'purchase'
  const parsed = toMilli(String(formData.get('quantity') ?? ''))
  const note = String(formData.get('note') ?? '').trim().slice(0, 240)

  if (!itemId || parsed === null || parsed === 0) redirect('/inventory?error=invalid')
  if (!canManageCommercial(ctx.role)) redirect('/inventory?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/inventory?error=demo')

  const db = getDb()
  const [item] = await db
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.orgId, ctx.orgId), eq(inventoryItems.id, itemId)))
    .limit(1)

  if (!item) redirect('/inventory?error=missing')

  const signed =
    reason === 'consumption' || reason === 'wastage'
      ? -Math.abs(parsed)
      : reason === 'correction'
        ? parsed
        : Math.abs(parsed)

  await db.insert(inventoryMovements).values({
    orgId: ctx.orgId,
    itemId,
    deltaMilli: signed,
    reason,
    note: note || null,
  })

  revalidatePath('/inventory')
  redirect('/inventory?saved=movement')
}
