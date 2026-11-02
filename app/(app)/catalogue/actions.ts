'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { serviceItems } from '@/lib/db/schema'
import { percentToBp, parseRupees } from '@/lib/domain/money'
import { isUnitClass } from '@/lib/domain/units'
import { verticalDescriptor } from '@/lib/domain/verticals'

export async function createCatalogueItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const verticalKey = String(formData.get('verticalKey') ?? 'catering').slice(0, 64)
  const back = `/catalogue?vertical=${encodeURIComponent(verticalKey)}`

  if (!canManageCommercial(ctx.role)) redirect(`${back}&error=permission`)

  const name = String(formData.get('name') ?? '').trim().slice(0, 160)
  const unitClassRaw = String(formData.get('unitClass') ?? '')
  const pricePaise = parseRupees(String(formData.get('price') ?? ''))
  const costRaw = String(formData.get('cost') ?? '').trim()
  const costPaise = costRaw ? parseRupees(costRaw) : null
  const taxPercent = Math.min(50, Math.max(0, Number(formData.get('taxPercent') ?? 0)))

  if (!name || !isUnitClass(unitClassRaw) || pricePaise === null) {
    redirect(`${back}&error=invalid`)
  }
  if (costRaw && costPaise === null) redirect(`${back}&error=invalid`)

  if (ctx.demo || !isDatabaseConfigured()) redirect(`${back}&error=demo`)

  const descriptor = verticalDescriptor(verticalKey)
  await getDb()
    .insert(serviceItems)
    .values({
      orgId: ctx.orgId,
      verticalKey,
      name,
      unitClass: unitClassRaw,
      unitLabel: descriptor.itemNoun,
      pricePaise,
      costPaise: costPaise ?? null,
      taxRateBp: percentToBp(taxPercent),
      active: true,
    })

  revalidatePath('/catalogue')
  revalidatePath('/dashboard')
  revalidatePath('/quotes/new')
  redirect(back)
}
