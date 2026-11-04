'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { servicePackages } from '@/lib/db/schema'
import { percentToBp, parseRupees } from '@/lib/domain/money'
import { UNIT_CLASSES } from '@/lib/domain/units'

function field(formData: FormData, key: string, max = 160): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

export async function createPackage(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/packages?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/packages?error=demo')

  const name = field(formData, 'name', 120)
  const verticalKey = field(formData, 'verticalKey', 60)
  const unitRaw = field(formData, 'unitClass', 20)
  const unitClass = UNIT_CLASSES.find((unit) => unit.key === unitRaw)?.key
  const rate = parseRupees(field(formData, 'rate', 20))
  const tax = Number(field(formData, 'taxPercent', 10) || 0)

  if (!name || !verticalKey || !unitClass || rate === null) redirect('/packages?error=invalid')

  const minQuantity = Math.max(0, Math.round(Number(formData.get('minQuantity') ?? 0)) || 0)
  const inclusions = field(formData, 'inclusions', 1000)
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24)

  await getDb().insert(servicePackages).values({
    orgId: ctx.orgId,
    name,
    verticalKey,
    unitClass,
    ratePaise: Math.max(0, rate),
    minQuantity,
    taxRateBp: percentToBp(Number.isFinite(tax) ? Math.min(Math.max(tax, 0), 100) : 0),
    inclusions,
  })

  revalidatePath('/packages')
  revalidatePath('/quotes/new')
  redirect('/packages?saved=1')
}

export async function togglePackage(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/packages?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/packages?error=demo')

  const id = field(formData, 'id', 64)
  const active = formData.get('active') === '1'
  if (!id) redirect('/packages?error=invalid')

  await getDb()
    .update(servicePackages)
    .set({ active })
    .where(and(eq(servicePackages.orgId, ctx.orgId), eq(servicePackages.id, id)))

  revalidatePath('/packages')
  revalidatePath('/quotes/new')
  redirect('/packages?saved=status')
}
