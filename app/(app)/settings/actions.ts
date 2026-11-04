'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { businesses, organisations } from '@/lib/db/schema'

const FONTS = ['Inter', 'Playfair Display', 'system-ui'] as const

function clampInt(raw: string, fallback: number, min: number, max: number): number {
  const value = Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.round(value), min), max)
}

function text(formData: FormData, key: string, max = 160): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

export async function updateSettings(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/settings?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/settings?error=demo')

  const name = text(formData, 'name', 120)
  const email = text(formData, 'email', 200)
  if (!name) redirect('/settings?error=name')
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect('/settings?error=email')

  const color = text(formData, 'brandPrimary', 7)
  const brandPrimary = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#1f4d3a'
  const fontRaw = text(formData, 'brandFont', 40)
  const brandFont = FONTS.find((font) => font === fontRaw) ?? 'Inter'
  const areas = text(formData, 'serviceAreas', 400)
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean)
    .slice(0, 20)

  const db = getDb()
  const [current] = await db
    .select({ settings: businesses.settings })
    .from(businesses)
    .where(eq(businesses.orgId, ctx.orgId))
    .limit(1)

  const existing = current?.settings ?? {}

  await db
    .update(businesses)
    .set({
      name,
      tagline: text(formData, 'tagline', 200) || null,
      city: text(formData, 'city', 80) || null,
      district: text(formData, 'district', 80) || null,
      phone: text(formData, 'phone', 24) || null,
      email: email || null,
      settings: {
        ...existing,
        taxMode: formData.get('taxMode') === 'inclusive' ? 'inclusive' : 'exclusive',
        advancePct: clampInt(String(formData.get('advancePct') ?? ''), 30, 0, 100),
        quoteValidityDays: clampInt(String(formData.get('quoteValidityDays') ?? ''), 7, 1, 365),
        serviceAreas: areas,
        brand: { ...(existing.brand ?? {}), primary: brandPrimary, font: brandFont },
      },
      updatedAt: new Date(),
    })
    .where(eq(businesses.orgId, ctx.orgId))

  if (ctx.role === 'owner') {
    await db.update(organisations).set({ name }).where(eq(organisations.id, ctx.orgId))
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/p', 'layout')
  redirect('/settings?saved=1')
}

export async function setPublished(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/settings?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/settings?error=demo')

  const published = formData.get('published') === '1'

  await getDb()
    .update(businesses)
    .set({ published, updatedAt: new Date() })
    .where(eq(businesses.orgId, ctx.orgId))

  revalidatePath('/settings')
  revalidatePath('/storefront')
  revalidatePath('/p', 'layout')
  redirect('/settings?saved=publish')
}

