import 'server-only'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { getDb } from './client'
import { serviceItems } from './schema'
import { menuCategories } from './schema-catering'
import {
  menuCategoryTranslations,
  serviceItemTranslations,
  type TranslationLocale,
} from './schema-translations'
import type { TranslationFields } from '@/lib/domain/translations'

type Db = ReturnType<typeof getDb>

/**
 * Reads and writes for business-content translations.
 *
 * Every query is scoped by `org_id` and bounded; there is no per-row fetch. Reads
 * return `Map` keyed by the source record's id, which is exactly the shape the
 * portal needs to overlay text while rendering a list.
 */

/** dish id → { name, description } in one language. Empty map when nothing is translated. */
export async function loadItemTranslations(
  db: Db,
  orgId: string,
  locale: TranslationLocale,
  itemIds: readonly string[],
): Promise<Map<string, TranslationFields>> {
  const ids = [...new Set(itemIds)]
  if (ids.length === 0) return new Map()

  const rows = await db
    .select({
      itemId: serviceItemTranslations.itemId,
      name: serviceItemTranslations.name,
      description: serviceItemTranslations.description,
    })
    .from(serviceItemTranslations)
    .where(
      and(
        eq(serviceItemTranslations.orgId, orgId),
        eq(serviceItemTranslations.locale, locale),
        inArray(serviceItemTranslations.itemId, ids),
      ),
    )
    .limit(1000)

  return new Map(rows.map((row) => [row.itemId, { name: row.name, description: row.description }]))
}

/** category id → { name, description } in one language. */
export async function loadCategoryTranslations(
  db: Db,
  orgId: string,
  locale: TranslationLocale,
  categoryIds: readonly string[],
): Promise<Map<string, TranslationFields>> {
  const ids = [...new Set(categoryIds)]
  if (ids.length === 0) return new Map()

  const rows = await db
    .select({
      categoryId: menuCategoryTranslations.categoryId,
      name: menuCategoryTranslations.name,
      description: menuCategoryTranslations.description,
    })
    .from(menuCategoryTranslations)
    .where(
      and(
        eq(menuCategoryTranslations.orgId, orgId),
        eq(menuCategoryTranslations.locale, locale),
        inArray(menuCategoryTranslations.categoryId, ids),
      ),
    )
    .limit(500)

  return new Map(
    rows.map((row) => [row.categoryId, { name: row.name, description: row.description }]),
  )
}

export interface MenuTranslationRow {
  id: string
  sourceName: string
  sourceDescription: string | null
  name: string
  description: string | null
  translated: boolean
}

/**
 * Everything the owner can translate, with whatever already exists for a language.
 *
 * A left join, so dishes with no translation still appear — an editor that hides
 * untranslated rows cannot be used to add the first one.
 */
export async function listMenuTranslations(
  db: Db,
  orgId: string,
  locale: TranslationLocale,
): Promise<{ items: MenuTranslationRow[]; categories: MenuTranslationRow[] }> {
  const [items, categories] = await Promise.all([
    db
      .select({
        id: serviceItems.id,
        sourceName: serviceItems.name,
        sourceDescription: serviceItems.description,
        name: serviceItemTranslations.name,
        description: serviceItemTranslations.description,
      })
      .from(serviceItems)
      .leftJoin(
        serviceItemTranslations,
        and(
          eq(serviceItemTranslations.itemId, serviceItems.id),
          eq(serviceItemTranslations.locale, locale),
        ),
      )
      .where(and(eq(serviceItems.orgId, orgId), eq(serviceItems.active, true)))
      .orderBy(asc(serviceItems.name))
      .limit(500),
    db
      .select({
        id: menuCategories.id,
        sourceName: menuCategories.name,
        sourceDescription: menuCategories.description,
        name: menuCategoryTranslations.name,
        description: menuCategoryTranslations.description,
      })
      .from(menuCategories)
      .leftJoin(
        menuCategoryTranslations,
        and(
          eq(menuCategoryTranslations.categoryId, menuCategories.id),
          eq(menuCategoryTranslations.locale, locale),
        ),
      )
      .where(and(eq(menuCategories.orgId, orgId), eq(menuCategories.active, true)))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name))
      .limit(200),
  ])

  const shape = (row: (typeof items)[number]): MenuTranslationRow => ({
    id: row.id,
    sourceName: row.sourceName,
    sourceDescription: row.sourceDescription ?? null,
    name: row.name ?? '',
    description: row.description ?? null,
    translated: Boolean(row.name),
  })

  return { items: items.map(shape), categories: categories.map(shape) }
}

/** Upsert one dish translation. The caller has already checked org membership. */
export async function saveItemTranslation(
  db: Db,
  input: {
    orgId: string
    itemId: string
    locale: TranslationLocale
    name: string
    description: string | null
  },
): Promise<void> {
  await db
    .insert(serviceItemTranslations)
    .values({
      orgId: input.orgId,
      itemId: input.itemId,
      locale: input.locale,
      name: input.name,
      description: input.description,
    })
    .onConflictDoUpdate({
      target: [serviceItemTranslations.itemId, serviceItemTranslations.locale],
      set: { name: input.name, description: input.description, updatedAt: new Date() },
    })
}

/** Upsert one category translation. */
export async function saveCategoryTranslation(
  db: Db,
  input: {
    orgId: string
    categoryId: string
    locale: TranslationLocale
    name: string
    description: string | null
  },
): Promise<void> {
  await db
    .insert(menuCategoryTranslations)
    .values({
      orgId: input.orgId,
      categoryId: input.categoryId,
      locale: input.locale,
      name: input.name,
      description: input.description,
    })
    .onConflictDoUpdate({
      target: [menuCategoryTranslations.categoryId, menuCategoryTranslations.locale],
      set: { name: input.name, description: input.description, updatedAt: new Date() },
    })
}

/** Remove a dish translation: the record falls back to the owner's source text. */
export async function deleteItemTranslation(
  db: Db,
  input: { orgId: string; itemId: string; locale: TranslationLocale },
): Promise<void> {
  await db
    .delete(serviceItemTranslations)
    .where(
      and(
        eq(serviceItemTranslations.orgId, input.orgId),
        eq(serviceItemTranslations.itemId, input.itemId),
        eq(serviceItemTranslations.locale, input.locale),
      ),
    )
}

/** Remove a category translation. */
export async function deleteCategoryTranslation(
  db: Db,
  input: { orgId: string; categoryId: string; locale: TranslationLocale },
): Promise<void> {
  await db
    .delete(menuCategoryTranslations)
    .where(
      and(
        eq(menuCategoryTranslations.orgId, input.orgId),
        eq(menuCategoryTranslations.categoryId, input.categoryId),
        eq(menuCategoryTranslations.locale, input.locale),
      ),
    )
}

/** How many of a workspace's dishes and categories carry a translation. */
export async function translationProgress(
  db: Db,
  orgId: string,
  locale: TranslationLocale,
): Promise<{ items: number; itemsTranslated: number; categories: number; categoriesTranslated: number }> {
  const { items, categories } = await listMenuTranslations(db, orgId, locale)
  return {
    items: items.length,
    itemsTranslated: items.filter((row) => row.translated).length,
    categories: categories.length,
    categoriesTranslated: categories.filter((row) => row.translated).length,
  }
}
