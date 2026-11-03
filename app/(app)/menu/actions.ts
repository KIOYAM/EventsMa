'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { menuGroups, menuSections, serviceItems } from '@/lib/db/schema'
import type { DietaryKey } from '@/lib/domain/menu'
import { parseRupees } from '@/lib/domain/money'
import {
  ORG_IMAGE_QUOTA_BYTES,
  ImageStorageUnavailable,
  isImageStorageConfigured,
  uploadMenuImage,
  validateMenuImage,
} from '@/lib/storage/menu-images'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DIETARY_KEYS: DietaryKey[] = ['veg', 'egg', 'non_veg']

function back(params: Record<string, string>): string {
  return `/menu?${new URLSearchParams(params).toString()}`
}

export async function createMenuSection(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const name = String(formData.get('name') ?? '').trim().slice(0, 80)
  const windowStart = String(formData.get('windowStart') ?? '').trim()
  const windowEnd = String(formData.get('windowEnd') ?? '').trim()

  const validTime = (value: string) => (value === '' ? null : TIME.test(value) ? value : 'invalid')

  if (!name) redirect(back({ error: 'name' }))
  const start = validTime(windowStart)
  const end = validTime(windowEnd)
  if (start === 'invalid' || end === 'invalid') redirect(back({ error: 'time' }))
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(menuSections)
    .where(eq(menuSections.orgId, ctx.orgId))

  await db.insert(menuSections).values({
    orgId: ctx.orgId,
    name,
    windowStart: start,
    windowEnd: end,
    sortOrder: row?.n ?? 0,
  })

  revalidatePath('/menu')
  redirect(back({ saved: 'section' }))
}

export async function createMenuGroup(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const sectionId = String(formData.get('sectionId') ?? '')
  const name = String(formData.get('name') ?? '').trim().slice(0, 80)
  const description = String(formData.get('description') ?? '').trim().slice(0, 240)

  if (!name || !sectionId) redirect(back({ error: 'name', section: sectionId }))
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission', section: sectionId }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo', section: sectionId }))

  const db = getDb()
  const [section] = await db
    .select({ id: menuSections.id })
    .from(menuSections)
    .where(and(eq(menuSections.orgId, ctx.orgId), eq(menuSections.id, sectionId)))
    .limit(1)

  if (!section) redirect(back({ error: 'section' }))

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(menuGroups)
    .where(and(eq(menuGroups.orgId, ctx.orgId), eq(menuGroups.sectionId, sectionId)))

  await db.insert(menuGroups).values({
    orgId: ctx.orgId,
    sectionId,
    name,
    description: description || null,
    sortOrder: row?.n ?? 0,
  })

  revalidatePath('/menu')
  redirect(back({ saved: 'group', section: sectionId }))
}

export async function createMenuItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  const groupId = String(formData.get('groupId') ?? '')
  const name = String(formData.get('name') ?? '').trim().slice(0, 160)
  const description = String(formData.get('description') ?? '').trim().slice(0, 400)
  const pricePaise = parseRupees(String(formData.get('price') ?? ''))
  const dietaryRaw = String(formData.get('dietary') ?? '')
  const dietary = DIETARY_KEYS.find((key) => key === dietaryRaw) ?? null
  const image = formData.get('image')

  if (!name || !groupId || pricePaise === null) {
    redirect(back({ error: 'name', section: String(formData.get('sectionId') ?? '') }))
  }
  if (!canManageCommercial(ctx.role)) redirect(back({ error: 'permission' }))
  if (ctx.demo || !isDatabaseConfigured()) redirect(back({ error: 'demo' }))

  const db = getDb()
  const [group] = await db
    .select({ id: menuGroups.id, sectionId: menuGroups.sectionId })
    .from(menuGroups)
    .where(and(eq(menuGroups.orgId, ctx.orgId), eq(menuGroups.id, groupId)))
    .limit(1)

  if (!group) redirect(back({ error: 'group' }))

  let imagePath: string | null = null
  let imageBytes = 0

  if (image instanceof File && image.size > 0) {
    const check = validateMenuImage(image)
    if (!check.ok) redirect(back({ error: `image_${check.reason}`, section: group.sectionId }))

    const [used] = await db
      .select({ total: sql<number>`coalesce(sum(${serviceItems.imageBytes}), 0)::int` })
      .from(serviceItems)
      .where(eq(serviceItems.orgId, ctx.orgId))

    if ((used?.total ?? 0) + check.bytes > ORG_IMAGE_QUOTA_BYTES) {
      redirect(back({ error: 'image_quota', section: group.sectionId }))
    }
    if (!isImageStorageConfigured()) redirect(back({ error: 'image_storage', section: group.sectionId }))

    try {
      const uploaded = await uploadMenuImage(ctx.orgId, image)
      imagePath = uploaded.path
      imageBytes = uploaded.bytes
    } catch (error) {
      const reason = error instanceof ImageStorageUnavailable ? 'image_storage' : 'image_failed'
      redirect(back({ error: reason, section: group.sectionId }))
    }
  }

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(serviceItems)
    .where(and(eq(serviceItems.orgId, ctx.orgId), eq(serviceItems.groupId, groupId)))

  await db.insert(serviceItems).values({
    orgId: ctx.orgId,
    verticalKey: 'catering',
    name,
    description: description || null,
    category: 'menu',
    sectionId: group.sectionId,
    groupId,
    unitClass: 'PER_GUEST',
    unitLabel: 'per guest',
    pricePaise,
    taxRateBp: 1800,
    dietary,
    imagePath,
    imageBytes,
    sortOrder: row?.n ?? 0,
    active: true,
  })

  revalidatePath('/menu')
  revalidatePath('/catalogue')
  revalidatePath('/quotes/new')
  redirect(back({ saved: 'item', section: group.sectionId }))
}
