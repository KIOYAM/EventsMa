'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { makeupArtists, makeupAppointments, makeupTrials } from '@/lib/db/schema-services'

const CreateMakeupArtistSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(24).optional(),
  email: z.string().email().optional().or(z.literal('')),
  skills: z.string().max(500).optional(),
  specializations: z.string().max(500).optional(),
  portfolioPath: z.string().max(500).optional(),
  ratePaisePerHour: z.coerce.number().int().min(0).default(0),
  travelFeePaise: z.coerce.number().int().min(0).default(0),
})

const CreateMakeupAppointmentSchema = z.object({
  artistId: z.string().uuid().optional(),
  clientName: z.string().min(1).max(120),
  serviceType: z.string().min(1).max(120),
  appointmentStart: z.string().datetime(),
  appointmentEnd: z.string().datetime(),
  location: z.string().max(200).optional(),
  travelRequired: z.enum(['true', 'false']).optional(),
  travelFeePaise: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
})

const CreateMakeupTrialSchema = z.object({
  artistId: z.string().uuid().optional(),
  clientName: z.string().min(1).max(120),
  trialDate: z.string().date(),
  trialStart: z.string().datetime().optional(),
  trialEnd: z.string().datetime().optional(),
  makeupStyle: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
})

export async function createMakeupArtist(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateMakeupArtistSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    skills: formData.get('skills'),
    specializations: formData.get('specializations'),
    portfolioPath: formData.get('portfolioPath'),
    ratePaisePerHour: formData.get('ratePaisePerHour'),
    travelFeePaise: formData.get('travelFeePaise'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(makeupArtists).values({
    orgId: ctx.orgId,
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    skills: parsed.data.skills ? parsed.data.skills.split(',').map((s) => s.trim()) : [],
    specializations: parsed.data.specializations
      ? parsed.data.specializations.split(',').map((s) => s.trim())
      : [],
    portfolioPath: parsed.data.portfolioPath ?? null,
    ratePaisePerHour: parsed.data.ratePaisePerHour,
    travelFeePaise: parsed.data.travelFeePaise,
  })

  revalidatePath('/makeup')
}

export async function createMakeupAppointment(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateMakeupAppointmentSchema.safeParse({
    artistId: formData.get('artistId'),
    clientName: formData.get('clientName'),
    serviceType: formData.get('serviceType'),
    appointmentStart: formData.get('appointmentStart'),
    appointmentEnd: formData.get('appointmentEnd'),
    location: formData.get('location'),
    travelRequired: formData.get('travelRequired'),
    travelFeePaise: formData.get('travelFeePaise'),
    notes: formData.get('notes'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(makeupAppointments).values({
    orgId: ctx.orgId,
    artistId: parsed.data.artistId ?? null,
    clientName: parsed.data.clientName,
    serviceType: parsed.data.serviceType,
    appointmentStart: new Date(parsed.data.appointmentStart),
    appointmentEnd: new Date(parsed.data.appointmentEnd),
    location: parsed.data.location ?? null,
    travelRequired: parsed.data.travelRequired === 'true',
    travelFeePaise: parsed.data.travelFeePaise,
    notes: parsed.data.notes ?? null,
  })

  revalidatePath('/makeup')
}

export async function createMakeupTrial(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const parsed = CreateMakeupTrialSchema.safeParse({
    artistId: formData.get('artistId'),
    clientName: formData.get('clientName'),
    trialDate: formData.get('trialDate'),
    trialStart: formData.get('trialStart'),
    trialEnd: formData.get('trialEnd'),
    makeupStyle: formData.get('makeupStyle'),
    notes: formData.get('notes'),
  })
  if (!parsed.success) return

  const db = getDb()
  await db.insert(makeupTrials).values({
    orgId: ctx.orgId,
    artistId: parsed.data.artistId ?? null,
    clientName: parsed.data.clientName,
    trialDate: parsed.data.trialDate,
    trialStart: parsed.data.trialStart ? new Date(parsed.data.trialStart) : null,
    trialEnd: parsed.data.trialEnd ? new Date(parsed.data.trialEnd) : null,
    makeupStyle: parsed.data.makeupStyle ?? null,
    approvalNotes: parsed.data.notes ?? null,
  })

  revalidatePath('/makeup')
}

export async function toggleMakeupArtistActive(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === '1'
  if (!id) return

  const db = getDb()
  await db
    .update(makeupArtists)
    .set({ active })
    .where(and(eq(makeupArtists.id, id), eq(makeupArtists.orgId, ctx.orgId)))

  revalidatePath('/makeup')
}

export async function approveMakeupTrial(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) return
  if (ctx.demo || !isDatabaseConfigured()) return

  const id = String(formData.get('id') ?? '')
  const approved = String(formData.get('approved') ?? '') === '1'
  if (!id) return

  const db = getDb()
  await db
    .update(makeupTrials)
    .set({ approved })
    .where(and(eq(makeupTrials.id, id), eq(makeupTrials.orgId, ctx.orgId)))

  revalidatePath('/makeup')
}
