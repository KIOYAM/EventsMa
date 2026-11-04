'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { portfolioItems } from '@/lib/db/schema'

const DATE = /^\d{4}-\d{2}-\d{2}$/

export async function addPortfolioItem(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
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
}

export async function setPortfolioPublished(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
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
}
