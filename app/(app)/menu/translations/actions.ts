'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { withWorkspace } from '@/lib/db/workspace'
import { serviceItems } from '@/lib/db/schema'
import { menuCategories } from '@/lib/db/schema-catering'
import {
  deleteCategoryTranslation,
  deleteItemTranslation,
  saveCategoryTranslation,
  saveItemTranslation,
} from '@/lib/db/content-translations'
import { isTranslatableLocale } from '@/lib/domain/translations'

const NAME_LIMIT = 120
const DESCRIPTION_LIMIT = 500

function back(locale: string, params: Record<string, string> = {}): string {
  return `/menu/translations?${new URLSearchParams({ locale, ...params }).toString()}`
}

/** Strip the id prefix so `item_name:<uuid>` becomes `<uuid>`. */
function idsFor(formData: FormData, prefix: string): string[] {
  return [...formData.keys()]
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .filter(Boolean)
}

function clean(value: FormDataEntryValue | null, limit: number): string {
  return String(value ?? '').trim().slice(0, limit)
}

/**
 * Save one language for many dishes and categories at once.
 *
 * One action for the whole page rather than one per row: a translator fills twenty
 * fields before pressing save, and twenty round trips would lose work when the
 * third one fails.
 *
 * A blank name means "no translation" — the row is deleted and the customer sees
 * the owner's source text. Writing an empty string instead would put a nameless
 * dish on a customer's screen.
 */
export async function saveTranslations(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()

  return withWorkspace(ctx, async () => {
    const requested = String(formData.get('locale') ?? '')
    if (!isTranslatableLocale(requested)) redirect(back('ta', { error: 'locale' }))

    const locale = requested
    if (!canManageCommercial(ctx.role)) redirect(back(locale, { error: 'permission' }))
    if (ctx.demo) redirect(back(locale, { error: 'demo' }))

    const db = getDb()
    const itemIds = idsFor(formData, 'item_name:')
    const categoryIds = idsFor(formData, 'category_name:')

    // Never trust the ids in the form: filter to rows this workspace owns before
    // writing anything, so a crafted request cannot attach a translation to
    // another tenant's dish.
    const ownedItems = itemIds.length
      ? await db
          .select({ id: serviceItems.id })
          .from(serviceItems)
          .where(and(eq(serviceItems.orgId, ctx.orgId), inArray(serviceItems.id, itemIds)))
      : []
    const ownedCategories = categoryIds.length
      ? await db
          .select({ id: menuCategories.id })
          .from(menuCategories)
          .where(and(eq(menuCategories.orgId, ctx.orgId), inArray(menuCategories.id, categoryIds)))
      : []

    let saved = 0

    for (const row of ownedItems) {
      const name = clean(formData.get(`item_name:${row.id}`), NAME_LIMIT)
      const description = clean(formData.get(`item_description:${row.id}`), DESCRIPTION_LIMIT)
      if (!name) {
        await deleteItemTranslation(db, { orgId: ctx.orgId, itemId: row.id, locale })
        continue
      }
      await saveItemTranslation(db, {
        orgId: ctx.orgId,
        itemId: row.id,
        locale,
        name,
        description: description || null,
      })
      saved += 1
    }

    for (const row of ownedCategories) {
      const name = clean(formData.get(`category_name:${row.id}`), NAME_LIMIT)
      const description = clean(formData.get(`category_description:${row.id}`), DESCRIPTION_LIMIT)
      if (!name) {
        await deleteCategoryTranslation(db, { orgId: ctx.orgId, categoryId: row.id, locale })
        continue
      }
      await saveCategoryTranslation(db, {
        orgId: ctx.orgId,
        categoryId: row.id,
        locale,
        name,
        description: description || null,
      })
      saved += 1
    }

    revalidatePath('/menu/translations')
    revalidatePath('/menu')
    // The customer link reads these rows, so its cache must not survive the edit.
    revalidatePath('/share/[slug]', 'page')

    redirect(back(locale, { saved: String(saved) }))
  })
}
