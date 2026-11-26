'use server'

import { and, asc, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { withWorkspace } from '@/lib/db/workspace'
import { portfolioItems } from '@/lib/db/schema'
import {
  isPortfolioStorageConfigured,
  removePortfolioImage,
  uploadPortfolioImage,
  validatePortfolioImage,
} from '@/lib/storage/portfolio-images'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Codes, not sentences: the uploader renders the message in the owner's language. */
export type PhotoErrorCode = 'permission' | 'demo' | 'missing' | 'type' | 'size' | 'storage'

export type PhotoResult = { ok: true } | { code: PhotoErrorCode }

function revalidatePublicSurface() {
  revalidatePath('/portfolio')
  revalidatePath('/storefront')
  revalidatePath('/p', 'layout')
}

export async function addPortfolioItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/portfolio?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/portfolio?error=demo')

    const title = String(formData.get('title') ?? '').trim().slice(0, 140)
    if (!title) redirect('/portfolio?error=title')

    const eventDate = String(formData.get('eventDate') ?? '')
    const venueName = String(formData.get('venueName') ?? '').trim().slice(0, 140)
    const description = String(formData.get('description') ?? '').trim().slice(0, 400)

    await getDb()
      .insert(portfolioItems)
      .values({
        orgId: ctx.orgId,
        title,
        eventDate: DATE.test(eventDate) ? eventDate : null,
        venueName: venueName || null,
        description: description || null,
        published: formData.get('published') === 'on',
      })

    revalidatePath('/portfolio')
    revalidatePath('/storefront')
    revalidatePath('/p', 'layout')
    redirect('/portfolio?saved=1')
  })
}

/**
 * Attach or replace one entry's photo.
 *
 * Returns a code instead of redirecting because the caller is a client component
 * mid-upload: a redirect would throw away the message the owner needs to see.
 */
export async function uploadPortfolioPhoto(formData: FormData): Promise<PhotoResult> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async (): Promise<PhotoResult> => {
    if (!canManageCommercial(ctx.role)) return { code: 'permission' }
    if (ctx.demo || !isDatabaseConfigured()) return { code: 'demo' }
    if (!isPortfolioStorageConfigured()) return { code: 'storage' }

    const id = String(formData.get('id') ?? '')
    const photo = formData.get('photo')
    if (!id || !(photo instanceof File)) return { code: 'missing' }

    const check = validatePortfolioImage(photo)
    if (!check.ok) return { code: check.reason === 'size' ? 'size' : 'type' }

    const db = getDb()
    const [item] = await db
      .select({ coverPath: portfolioItems.coverPath })
      .from(portfolioItems)
      .where(and(eq(portfolioItems.orgId, ctx.orgId), eq(portfolioItems.id, id)))
      .limit(1)
    if (!item) return { code: 'missing' }

    try {
      const { path } = await uploadPortfolioImage(ctx.orgId, id, photo)
      await db
        .update(portfolioItems)
        .set({ coverPath: path })
        .where(and(eq(portfolioItems.orgId, ctx.orgId), eq(portfolioItems.id, id)))

      // Only after the new path is stored, so a failed update leaves the old photo intact.
      if (item.coverPath) await removePortfolioImage(item.coverPath)

      revalidatePublicSurface()
      return { ok: true }
    } catch {
      return { code: 'storage' }
    }
  })
}

export async function removePortfolioPhoto(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/portfolio?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/portfolio?error=demo')

    const id = String(formData.get('id') ?? '')
    if (!id) redirect('/portfolio?error=missing')

    const db = getDb()
    const [item] = await db
      .select({ coverPath: portfolioItems.coverPath })
      .from(portfolioItems)
      .where(and(eq(portfolioItems.orgId, ctx.orgId), eq(portfolioItems.id, id)))
      .limit(1)
    if (!item) redirect('/portfolio?error=missing')

    await db
      .update(portfolioItems)
      .set({ coverPath: null })
      .where(and(eq(portfolioItems.orgId, ctx.orgId), eq(portfolioItems.id, id)))
    await removePortfolioImage(item.coverPath)

    revalidatePublicSurface()
    redirect('/portfolio?saved=photo')
  })
}

/**
 * Manual order, not a date sort.
 *
 * Owners put their best work first; `sort_order` is rewritten for the whole list
 * after a swap so the values stay contiguous and a later insert cannot squeeze
 * itself between two neighbours.
 */
export async function movePortfolioItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/portfolio?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/portfolio?error=demo')

    const id = String(formData.get('id') ?? '')
    const direction = formData.get('direction') === 'up' ? 'up' : 'down'
    if (!id) redirect('/portfolio?error=missing')

    const db = getDb()
    const rows = await db
      .select({ id: portfolioItems.id })
      .from(portfolioItems)
      .where(eq(portfolioItems.orgId, ctx.orgId))
      .orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.eventDate))

    const index = rows.findIndex((row) => row.id === id)
    if (index === -1) redirect('/portfolio?error=missing')

    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= rows.length) redirect('/portfolio?saved=order')

    const ordered = [...rows]
    const [moved] = ordered.splice(index, 1)
    if (moved) ordered.splice(target, 0, moved)

    await db.transaction(async (tx) => {
      for (const [position, row] of ordered.entries()) {
        await tx
          .update(portfolioItems)
          .set({ sortOrder: position })
          .where(and(eq(portfolioItems.orgId, ctx.orgId), eq(portfolioItems.id, row.id)))
      }
    })

    revalidatePublicSurface()
    redirect('/portfolio?saved=order')
  })
}

export async function setPortfolioPublished(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/portfolio?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/portfolio?error=demo')

    const id = String(formData.get('id') ?? '')
    if (!id) redirect('/portfolio?error=missing')

    await getDb()
      .update(portfolioItems)
      .set({ published: formData.get('published') === '1' })
      .where(and(eq(portfolioItems.orgId, ctx.orgId), eq(portfolioItems.id, id)))

    revalidatePath('/portfolio')
    revalidatePath('/storefront')
    revalidatePath('/p', 'layout')
    redirect('/portfolio?saved=publish')
  })
}
