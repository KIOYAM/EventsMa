import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { events, inventoryItems, organisations, serviceItems } from './schema'

/**
 * The catering engine's tables.
 *
 * Sessions, categories, dietary labels and selection limits are owner rows, not
 * enums (design D1/D2), because a temple kitchen and a wedding venue do not serve
 * the same meals at the same hours. Nothing here is catering-specific in shape:
 * photography and decor reuse the session and selection-rule engine unchanged.
 */

/** A reusable service period: "Breakfast 07:00–09:30", "Reception dinner". */
export const cateringSessions = pgTable(
  'catering_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    /** 'HH:MM' 24h, tenant-local. Presentation and planning only. */
    startTime: text('start_time'),
    endTime: text('end_time'),
    minGuests: integer('min_guests'),
    maxGuests: integer('max_guests'),
    /** Hours before service when the guest count is frozen. */
    cutoffHours: integer('cutoff_hours'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('catering_sessions_org_name_key').on(t.orgId, t.name),
    index('catering_sessions_org_sort_idx').on(t.orgId, t.active, t.sortOrder),
  ],
)

/** "Welcome drinks", "Starters", "Live counters" — the owner's own vocabulary. */
export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('menu_categories_org_name_key').on(t.orgId, t.name),
    index('menu_categories_org_sort_idx').on(t.orgId, t.active, t.sortOrder),
  ],
)

/**
 * Food preference and allergen labels. `isAllergen` separates a safety fact from
 * a preference: "Jain" is a preference, "peanut" is a warning.
 */
export const dietaryProfiles = pgTable(
  'dietary_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    isAllergen: boolean('is_allergen').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('dietary_profiles_org_key_key').on(t.orgId, t.key),
    index('dietary_profiles_org_sort_idx').on(t.orgId, t.active, t.sortOrder),
  ],
)

/**
 * How many dishes a guest may pick from one category in one session.
 *
 * `maxSelections` null means unlimited — the engine must never treat null as
 * zero. The server validates against this row on write and re-checks on read,
 * because an owner may tighten a limit after dishes were chosen.
 */
export const categorySelectionRules = pgTable(
  'category_selection_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => cateringSessions.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'cascade' }),
    minSelections: integer('min_selections').notNull().default(0),
    /** null = unlimited. */
    maxSelections: integer('max_selections'),
    required: boolean('required').notNull().default(false),
    allowSubstitutions: boolean('allow_substitutions').notNull().default(true),
    allowCustomRequests: boolean('allow_custom_requests').notNull().default(false),
    /** 'per_guest' | 'per_unit' | 'flat' — how a selected line is priced. */
    pricingMode: text('pricing_mode').notNull().default('per_guest'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('category_selection_rules_session_category_key').on(t.sessionId, t.categoryId),
    index('category_selection_rules_org_session_idx').on(t.orgId, t.sessionId, t.sortOrder),
  ],
)

/** A dish can be a starter and a live counter at the same time. */
export const menuItemCategories = pgTable(
  'menu_item_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => serviceItems.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('menu_item_categories_item_category_key').on(t.itemId, t.categoryId),
    index('menu_item_categories_org_category_idx').on(t.orgId, t.categoryId),
  ],
)

/**
 * One service on one event. Guest count is here, never on the event, because a
 * wedding serves 500 at lunch and 300 at dinner (design D3).
 */
export const eventCateringSessions = pgTable(
  'event_catering_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    /** The template this instance came from; null once the template is deleted. */
    templateId: uuid('template_id').references(() => cateringSessions.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    sessionDate: date('session_date'),
    startTime: text('start_time'),
    endTime: text('end_time'),
    guestCount: integer('guest_count').notNull().default(0),
    /** 'buffet' | 'seated' | 'banana_leaf' | 'packed' | owner text. */
    serviceStyle: text('service_style'),
    /** 'planned' | 'confirmed' | 'served' | 'cancelled'. */
    status: text('status').notNull().default('planned'),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('event_catering_sessions_org_event_idx').on(t.orgId, t.eventId, t.sortOrder),
    index('event_catering_sessions_org_date_idx').on(t.orgId, t.sessionDate, t.status),
  ],
)

/**
 * A chosen dish inside a session, with name, unit and price captured at the
 * moment of choosing (design D4). Editing the catalogue later must not rewrite
 * a confirmed booking.
 */
export const sessionMenuItems = pgTable(
  'session_menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventSessionId: uuid('event_session_id')
      .notNull()
      .references(() => eventCateringSessions.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => serviceItems.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id').references(() => menuCategories.id, { onDelete: 'set null' }),
    nameSnapshot: text('name_snapshot').notNull(),
    unitSnapshot: text('unit_snapshot'),
    unitPricePaise: integer('unit_price_paise').notNull().default(0),
    /** PER_GUEST / PER_PLATE / PER_UNIT / FLAT — copied from the item at selection. */
    unitClassSnapshot: text('unit_class_snapshot').notNull().default('PER_GUEST'),
    dietarySnapshot: text('dietary_snapshot'),
    quantity: integer('quantity').notNull().default(1),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('session_menu_items_org_session_idx').on(t.orgId, t.eventSessionId),
    uniqueIndex('session_menu_items_session_item_key').on(t.eventSessionId, t.itemId),
  ],
)

/** "120 veg, 40 non-veg, 15 Jain" — slice 1 of individual guest selection (D5). */
export const sessionDietaryCounts = pgTable(
  'session_dietary_counts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventSessionId: uuid('event_session_id')
      .notNull()
      .references(() => eventCateringSessions.id, { onDelete: 'cascade' }),
    profileKey: text('profile_key').notNull(),
    count: integer('count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('session_dietary_counts_session_profile_key').on(t.eventSessionId, t.profileKey),
    index('session_dietary_counts_org_session_idx').on(t.orgId, t.eventSessionId),
  ],
)

/**
 * A recipe row: what one served portion consumes. Quantities are stored in
 * thousandths of the unit (`unit` is g, ml or piece) so arithmetic stays integer,
 * exactly like money. `wastageBp` is basis points (500 = 5%).
 */
export const menuItemIngredients = pgTable(
  'menu_item_ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => serviceItems.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    quantityMilliPerServing: integer('quantity_milli_per_serving').notNull().default(0),
    /** 'g' | 'ml' | 'piece'. */
    unit: text('unit').notNull().default('g'),
    wastageBp: integer('wastage_bp').notNull().default(0),
    note: text('note'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('menu_item_ingredients_org_item_idx').on(t.orgId, t.itemId, t.sortOrder),
    index('menu_item_ingredients_org_inventory_idx').on(t.orgId, t.inventoryItemId),
  ],
)

/**
 * Immutable capture of an event's catering at quote-send or confirmation time.
 * A snapshot is never edited; a new one is appended.
 */
export const cateringSnapshots = pgTable(
  'catering_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    /** 'quote_sent' | 'confirmed' | 'manual'. */
    reason: text('reason').notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
    payload: jsonb('payload').$type<unknown>().notNull(),
  },
  (t) => [index('catering_snapshots_org_event_idx').on(t.orgId, t.eventId, t.capturedAt)],
)
