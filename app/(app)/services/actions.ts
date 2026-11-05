'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { businessServices } from '@/lib/db/schema'
import { verticalDescriptor } from '@/lib/domain/verticals'

const SetServiceEnabledSchema = z.object({
  verticalKey: z.string().min(1).max(64),
  enable: z.enum(['0', '1']),
})

const SetServiceConfigSchema = z.object({
  verticalKey: z.string().min(1).max(64),
  key: z.string().min(1).max(64),
  value: z.string().max(1000),
})

export async function setServiceEnabled(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return

  const parsed = SetServiceEnabledSchema.safeParse({
    verticalKey: formData.get('verticalKey'),
    enable: formData.get('enable'),
  })
  if (!parsed.success) return

  const { verticalKey, enable } = parsed.data
  const enabled = enable === '1'

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
    if (existing.enabled === enabled) return
    await db
      .update(businessServices)
      .set({ enabled })
      .where(eq(businessServices.id, existing.id))
  } else {
    await db.insert(businessServices).values({
      orgId: ctx.orgId,
      verticalKey,
      enabled,
      config: {},
    })
  }

  revalidatePath('/services')
  revalidatePath('/dashboard')
  revalidatePath('/catalogue')
  revalidatePath('/quotes/new')
}

export async function setServiceConfig(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return

  const parsed = SetServiceConfigSchema.safeParse({
    verticalKey: formData.get('verticalKey'),
    key: formData.get('key'),
    value: formData.get('value'),
  })
  if (!parsed.success) return

  const { verticalKey, key, value } = parsed.data

  // Validate the config field exists for this vertical
  const descriptor = verticalDescriptor(verticalKey)
  const field = descriptor.configFields.find((f) => f.key === key)
  if (!field) return

  // For select fields, validate the value is an allowed option
  if (field.kind === 'select' && field.options && !field.options.includes(value)) return

  // Demo mode is read-only by design: nothing is written without a database.
  if (ctx.demo || !isDatabaseConfigured()) return

  const db = getDb()
  const [existing] = await db
    .select({ id: businessServices.id, config: businessServices.config })
    .from(businessServices)
    .where(
      and(eq(businessServices.orgId, ctx.orgId), eq(businessServices.verticalKey, verticalKey)),
    )
    .limit(1)

  if (!existing) return

  await db
    .update(businessServices)
    .set({ config: { ...existing.config, [key]: value } })
    .where(eq(businessServices.id, existing.id))

  revalidatePath('/services')
  revalidatePath(`/services/${verticalKey}`)
}
