'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { businessServices } from '@/lib/db/schema'

export async function setServiceEnabled(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return

  const verticalKey = String(formData.get('verticalKey') ?? '').slice(0, 64)
  const enable = String(formData.get('enable') ?? '') === '1'
  if (!verticalKey) return

  // Demo mode is read-only by design: nothing is written without a database.
  if (ctx.demo || !isDatabaseConfigured()) return

  const db = getDb()
  const [existing] = await db
    .select({ id: businessServices.id, enabled: businessServices.enabled })
    .from(businessServices)
    .where(
      and(eq(businessServices.orgId, ctx.orgId), eq(businessServices.verticalKey, verticalKey)),
    )
    .limit(1)

  if (existing) {
    if (existing.enabled === enable) return
    await db
      .update(businessServices)
      .set({ enabled: enable })
      .where(eq(businessServices.id, existing.id))
  } else {
    await db.insert(businessServices).values({
      orgId: ctx.orgId,
      verticalKey,
      enabled: enable,
      config: {},
    })
  }

  revalidatePath('/services')
  revalidatePath('/dashboard')
  revalidatePath('/catalogue')
  revalidatePath('/quotes/new')
}
