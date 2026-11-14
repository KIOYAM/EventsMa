import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { organisations, serviceItems } from './schema'
import { menuCategories } from './schema-catering'

/**
 * Per-language rows for business content.
 *
 * One dish id, many languages. `service_items.name` stays the source of truth for
 * the language the owner typed; these rows add the rest, and every read falls back
 * to the source field when a translation is missing.
 *
 * 'en' is not a valid locale here on purpose: English lives in the source column.
 * Letting an English row exist would give the same text two homes and two places
 * to drift apart.
 */
export const TRANSLATION_LOCALES = ['ta', 'te', 'kn', 'ml'] as const
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number]

export const serviceItemTranslations = pgTable(
  'service_item_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => serviceItems.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('service_item_translations_item_locale_key').on(t.itemId, t.locale),
    index('service_item_translations_org_locale_idx').on(t.orgId, t.locale),
  ],
)

export const menuCategoryTranslations = pgTable(
  'menu_category_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('menu_category_translations_category_locale_key').on(t.categoryId, t.locale),
    index('menu_category_translations_org_locale_idx').on(t.orgId, t.locale),
  ],
)
