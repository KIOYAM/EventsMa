'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  decorationAreas,
  decorationSetups,
  decorationMaterials,
} from '@/lib/db/schema-services'

const CreateDecorationAreaSchema = z.object({
  name: z.string().min(1).max(120),
  areaType: z.string().min(1).max(64),
  description: z.string().max(500).optional(),
  dimensions: z.string().max(120).optional(),
  setupNotes: z.string().max(500).optional(),
})

const CreateDecorationSetupSchema = z.object({
  areaId: z.string().uuid().optional(),
  setupStart: z.string().datetime().optional(),
  setupEnd: z.string().datetime().optional(),
  teardownStart: z.string().datetime().optional(),
  teardownEnd: z.string().datetime().optional(),
  crewAssigned: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

const CreateDecorationMaterialSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(64),
  unit: z.string().min(1).max(32),
  quantityAvailable: z.coerce.number().int().min(0).default(0),
  quantityUnit: z.string().min(1).max(32),
  costPaisePerUnit: z.coerce.number().int().min(0).default(0),
  supplier: z.string().max(200).optional(),
})

export async function createDecorationArea(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateDecorationAreaSchema.safeParse({
    name: formData.get('name'),
    areaType: formData.get('areaType'),
    description: formData.get('description'),
    dimensions: formData.get('dimensions'),
    setupNotes: formData.get('setupNotes'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(decorationAreas).values({
    orgId: ctx.orgId,
    name: parsed.data.name,
    areaType: parsed.data.areaType,
    description: parsed.data.description ?? null,
    dimensions: parsed.data.dimensions ?? null,
    setupNotes: parsed.data.setupNotes ?? null,
  })

  revalidatePath('/decoration')
}

export async function createDecorationSetup(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateDecorationSetupSchema.safeParse({
    areaId: formData.get('areaId'),
    setupStart: formData.get('setupStart'),
    setupEnd: formData.get('setupEnd'),
    teardownStart: formData.get('teardownStart'),
    teardownEnd: formData.get('teardownEnd'),
    crewAssigned: formData.get('crewAssigned'),
    notes: formData.get('notes'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(decorationSetups).values({
    orgId: ctx.orgId,
    areaId: parsed.data.areaId ?? null,
    setupStart: parsed.data.setupStart ? new Date(parsed.data.setupStart) : null,
    setupEnd: parsed.data.setupEnd ? new Date(parsed.data.setupEnd) : null,
    teardownStart: parsed.data.teardownStart ? new Date(parsed.data.teardownStart) : null,
    teardownEnd: parsed.data.teardownEnd ? new Date(parsed.data.teardownEnd) : null,
    crewAssigned: parsed.data.crewAssigned ?? null,
    notes: parsed.data.notes ?? null,
  })

  revalidatePath('/decoration')
}

export async function createDecorationMaterial(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateDecorationMaterialSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    unit: formData.get('unit'),
    quantityAvailable: formData.get('quantityAvailable'),
    quantityUnit: formData.get('quantityUnit'),
    costPaisePerUnit: formData.get('costPaisePerUnit'),
    supplier: formData.get('supplier'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(decorationMaterials).values({
    orgId: ctx.orgId,
    name: parsed.data.name,
    category: parsed.data.category,
    unit: parsed.data.unit,
    quantityAvailable: parsed.data.quantityAvailable,
    quantityUnit: parsed.data.quantityUnit,
    costPaisePerUnit: parsed.data.costPaisePerUnit,
    supplier: parsed.data.supplier ?? null,
  })

  revalidatePath('/decoration')
}

export async function toggleDecorationAreaActive(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === '1'
  if (!id) return

  const db = getDb()
  await db
    .update(decorationAreas)
    .set({ active })
    .where(and(eq(decorationAreas.id, id), eq(decorationAreas.orgId, ctx.orgId)))

  revalidatePath('/decoration')
}

export async function toggleDecorationMaterialActive(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === '1'
  if (!id) return

  const db = getDb()
  await db
    .update(decorationMaterials)
    .set({ active })
    .where(and(eq(decorationMaterials.id, id), eq(decorationMaterials.orgId, ctx.orgId)))

  revalidatePath('/decoration')
}
