'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  photographyCoverage,
  photographyAssignments,
  photographyShotLists,
  photographyDeliverables,
} from '@/lib/db/schema-services'

const CreateCoverageSchema = z.object({
  coverageType: z.string().min(1).max(120),
  coverageStart: z.string().datetime(),
  coverageEnd: z.string().datetime(),
  location: z.string().max(200).optional(),
  shotListNotes: z.string().max(500).optional(),
})

const CreateAssignmentSchema = z.object({
  coverageId: z.string().uuid().optional(),
  photographerName: z.string().min(1).max(120),
  role: z.enum(['photographer', 'assistant', 'second_shooter']),
  equipment: z.string().max(300).optional(),
})

const CreateShotListSchema = z.object({
  moment: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'normal', 'high', 'must_capture']).default('normal'),
})

const CreateDeliverableSchema = z.object({
  deliverableType: z.string().min(1).max(120),
  quantity: z.coerce.number().int().min(0).default(1),
  deliveryDate: z.string().date().optional(),
  notes: z.string().max(500).optional(),
})

export async function createCoverage(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateCoverageSchema.safeParse({
    coverageType: formData.get('coverageType'),
    coverageStart: formData.get('coverageStart'),
    coverageEnd: formData.get('coverageEnd'),
    location: formData.get('location'),
    shotListNotes: formData.get('shotListNotes'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(photographyCoverage).values({
    orgId: ctx.orgId,
    coverageType: parsed.data.coverageType,
    coverageStart: new Date(parsed.data.coverageStart),
    coverageEnd: new Date(parsed.data.coverageEnd),
    location: parsed.data.location ?? null,
    shotListNotes: parsed.data.shotListNotes ?? null,
  })

  revalidatePath('/photography')
}

export async function createAssignment(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateAssignmentSchema.safeParse({
    coverageId: formData.get('coverageId'),
    photographerName: formData.get('photographerName'),
    role: formData.get('role'),
    equipment: formData.get('equipment'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(photographyAssignments).values({
    orgId: ctx.orgId,
    coverageId: parsed.data.coverageId ?? null,
    photographerName: parsed.data.photographerName,
    role: parsed.data.role,
    equipment: parsed.data.equipment ?? null,
  })

  revalidatePath('/photography')
}

export async function createShotListItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateShotListSchema.safeParse({
    moment: formData.get('moment'),
    description: formData.get('description'),
    priority: formData.get('priority'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(photographyShotLists).values({
    orgId: ctx.orgId,
    moment: parsed.data.moment,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
  })

  revalidatePath('/photography')
}

export async function createDeliverable(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateDeliverableSchema.safeParse({
    deliverableType: formData.get('deliverableType'),
    quantity: formData.get('quantity'),
    deliveryDate: formData.get('deliveryDate'),
    notes: formData.get('notes'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(photographyDeliverables).values({
    orgId: ctx.orgId,
    deliverableType: parsed.data.deliverableType,
    quantity: parsed.data.quantity,
    deliveryDate: parsed.data.deliveryDate ?? null,
    notes: parsed.data.notes ?? null,
  })

  revalidatePath('/photography')
}

export async function toggleDeliverableStatus(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !status) return

  const db = getDb()
  await db
    .update(photographyDeliverables)
    .set({ status: status as any })
    .where(
      and(eq(photographyDeliverables.id, id), eq(photographyDeliverables.orgId, ctx.orgId)),
    )

  revalidatePath('/photography')
}

export async function toggleShotCaptured(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const id = String(formData.get('id') ?? '')
  const captured = String(formData.get('captured') ?? '') === '1'
  if (!id) return

  const db = getDb()
  await db
    .update(photographyShotLists)
    .set({ captured })
    .where(and(eq(photographyShotLists.id, id), eq(photographyShotLists.orgId, ctx.orgId)))

  revalidatePath('/photography')
}
