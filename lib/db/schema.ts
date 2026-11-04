/**
 * EventsMa schema.
 *
 * Rules encoded here, not in prose:
 *  - org_id is NOT NULL on every tenant table, and every index leads with it.
 *  - Money is integer paise. There is no float column in this file.
 *  - A sent quotation is immutable: `quotation_versions` is append-only and
 *    `quotation_lines` belongs to a version, never to the quotation.
 *  - Payments are append-only; an idempotency key makes a webhook replay harmless.
 *  - Catalogue rows carry `vertical_key`, so catering, photography and decor share
 *    one table without a per-vertical branch in the maths.
 */

import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const memberRole = pgEnum('member_role', ['owner', 'manager', 'employee'])
export const quoteStatus = pgEnum('quote_status', [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'expired',
  'declined',
  'cancelled',
])
export const enquiryStatus = pgEnum('enquiry_status', [
  'new',
  'contacted',
  'qualified',
  'quoted',
  'won',
  'lost',
  'spam',
])
export const eventStatus = pgEnum('event_status', [
  'enquiry',
  'tentative',
  'confirmed',
  'completed',
  'cancelled',
])
export const paymentStatus = pgEnum('payment_status', ['pending', 'captured', 'failed', 'refunded'])
export const invoiceStatus = pgEnum('invoice_status', ['issued', 'part_paid', 'paid', 'void'])
export const unitClassEnum = pgEnum('unit_class', [
  'PER_GUEST',
  'PER_UNIT',
  'FLAT',
  'PER_HOUR',
  'PER_DAY',
])

export const organisations = pgTable(
  'organisations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    plan: text('plan').notNull().default('trial'),
    status: text('status').notNull().default('active'),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('organisations_slug_key').on(t.slug)],
)

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: memberRole('role').notNull().default('owner'),
    /** Cached from auth so the team screen never needs the auth schema. */
    email: text('email'),
    displayName: text('display_name'),
    phone: text('phone'),
    /** Free-text skills for crew assignment: "dosa counter", "drone". */
    skills: text('skills').array().notNull().default([]),
    wagePaisePerDay: integer('wage_paise_per_day'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('memberships_org_user_key').on(t.orgId, t.userId),
    index('memberships_user_idx').on(t.userId),
    index('memberships_org_role_idx').on(t.orgId, t.role),
  ],
)

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tagline: text('tagline'),
    city: text('city'),
    district: text('district'),
    phone: text('phone'),
    email: text('email'),
    logoPath: text('logo_path'),
    published: boolean('published').notNull().default(false),
    /** taxMode, advancePct, quoteValidityDays, serviceAreas, brand tokens. */
    settings: jsonb('settings')
      .$type<{
        taxMode?: 'exclusive' | 'inclusive'
        advancePct?: number
        quoteValidityDays?: number
        serviceAreas?: string[]
        brand?: { primary?: string; font?: string }
      }>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('businesses_org_key').on(t.orgId)],
)

/** Which services this business actually provides, and how each one is configured. */
export const businessServices = pgTable(
  'business_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    verticalKey: text('vertical_key').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    config: jsonb('config').$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('business_services_org_vertical_key').on(t.orgId, t.verticalKey),
    index('business_services_org_enabled_idx').on(t.orgId, t.enabled),
  ],
)

/** A meal period: breakfast, lunch, dinner, high tea, live counters. Display sorting only. */
export const menuSections = pgTable(
  'menu_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** 'HH:MM' in 24h, tenant-local. Presentation only — never used in pricing. */
    windowStart: text('window_start'),
    windowEnd: text('window_end'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('menu_sections_org_sort_idx').on(t.orgId, t.active, t.sortOrder)],
)

/** A group inside a meal period: "South Indian hot", "Live counters", "Desserts". */
export const menuGroups = pgTable(
  'menu_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => menuSections.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('menu_groups_org_section_idx').on(t.orgId, t.sectionId, t.sortOrder)],
)

export const serviceItems = pgTable(
  'service_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    verticalKey: text('vertical_key').notNull(),
    name: text('name').notNull(),
    category: text('category'),
    unitClass: unitClassEnum('unit_class').notNull().default('FLAT'),
    /** Free-text tenant wording: "per plate", "per coverage day". Never parsed. */
    unitLabel: text('unit_label'),
    pricePaise: integer('price_paise').notNull().default(0),
    costPaise: integer('cost_paise'),
    taxRateBp: integer('tax_rate_bp').notNull().default(1800),
    /** veg, allergens, coverage hours, dimensions — vertical-specific, never queried by the engine. */
    attrs: jsonb('attrs').$type<Record<string, unknown>>().notNull().default({}),
    imagePath: text('image_path'),
    description: text('description'),
    /** Which meal period this dish is served in. Nullable: quotes never require it. */
    sectionId: uuid('section_id').references(() => menuSections.id, { onDelete: 'set null' }),
    groupId: uuid('group_id').references(() => menuGroups.id, { onDelete: 'set null' }),
    /** Bytes actually stored, so the per-org quota is a sum, not a guess. */
    imageBytes: integer('image_bytes').notNull().default(0),
    /** 'veg' | 'non_veg' | 'egg' | null — an FSSAI marker, not a dietary engine. */
    dietary: text('dietary'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('service_items_org_vertical_active_idx').on(t.orgId, t.verticalKey, t.active),
    index('service_items_org_name_idx').on(t.orgId, t.name),
  ],
)

export const servicePackages = pgTable(
  'service_packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    verticalKey: text('vertical_key').notNull(),
    name: text('name').notNull(),
    unitClass: unitClassEnum('unit_class').notNull().default('FLAT'),
    ratePaise: integer('rate_paise').notNull().default(0),
    minQuantity: integer('min_quantity').notNull().default(0),
    taxRateBp: integer('tax_rate_bp').notNull().default(1800),
    inclusions: text('inclusions').array().notNull().default([]),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('service_packages_org_vertical_idx').on(t.orgId, t.verticalKey, t.active)],
)

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** E.164-normalised, used for duplicate detection. */
    phoneNormalized: text('phone_normalized'),
    phone: text('phone'),
    email: text('email'),
    source: text('source'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('clients_org_phone_idx').on(t.orgId, t.phoneNormalized),
    index('clients_org_name_idx').on(t.orgId, t.name),
  ],
)

export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    eventDate: date('event_date'),
    guests: integer('guests').notNull().default(0),
    eventType: text('event_type'),
    message: text('message'),
    status: enquiryStatus('status').notNull().default('new'),
    source: text('source'),
    nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('enquiries_org_status_idx').on(t.orgId, t.status, t.createdAt)],
)

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    eventType: text('event_type'),
    eventDate: date('event_date').notNull(),
    startTime: text('start_time'),
    endTime: text('end_time'),
    venueName: text('venue_name'),
    venueAddress: text('venue_address'),
    guests: integer('guests').notNull().default(0),
    status: eventStatus('status').notNull().default('enquiry'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('events_org_date_idx').on(t.orgId, t.eventDate, t.status)],
)

export const quotations = pgTable(
  'quotations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    number: text('number').notNull(),
    status: quoteStatus('status').notNull().default('draft'),
    currentVersionId: uuid('current_version_id'),
    /** Signed, unguessable token for the public quote page. */
    publicToken: text('public_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedByEmail: text('accepted_by_email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('quotations_org_number_key').on(t.orgId, t.number),
    uniqueIndex('quotations_public_token_key').on(t.publicToken),
    index('quotations_org_status_idx').on(t.orgId, t.status, t.createdAt),
  ],
)

/** Append-only. A revision inserts version N+1; it never updates version N. */
export const quotationVersions = pgTable(
  'quotation_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    subtotalPaise: integer('subtotal_paise').notNull(),
    discountPaise: integer('discount_paise').notNull().default(0),
    taxPaise: integer('tax_paise').notNull().default(0),
    roundOffPaise: integer('round_off_paise').notNull().default(0),
    totalPaise: integer('total_paise').notNull(),
    costPaise: integer('cost_paise').notNull().default(0),
    marginPaise: integer('margin_paise').notNull().default(0),
    guests: integer('guests').notNull().default(0),
    contentHash: text('content_hash'),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull().default({}),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('quotation_versions_number_key').on(t.quotationId, t.version),
    index('quotation_versions_org_idx').on(t.orgId, t.createdAt),
  ],
)

export const quotationLines = pgTable(
  'quotation_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    versionId: uuid('version_id')
      .notNull()
      .references(() => quotationVersions.id, { onDelete: 'cascade' }),
    serviceKey: text('service_key').notNull(),
    label: text('label').notNull(),
    unitClass: unitClassEnum('unit_class').notNull(),
    unitLabel: text('unit_label'),
    basis: integer('basis').notNull(),
    unitRatePaise: integer('unit_rate_paise').notNull(),
    grossPaise: integer('gross_paise').notNull(),
    discountPaise: integer('discount_paise').notNull().default(0),
    taxablePaise: integer('taxable_paise').notNull(),
    taxRateBp: integer('tax_rate_bp').notNull().default(0),
    taxPaise: integer('tax_paise').notNull().default(0),
    totalPaise: integer('total_paise').notNull(),
    costPaise: integer('cost_paise').notNull().default(0),
    included: boolean('included').notNull().default(false),
    minQuantityApplied: boolean('min_quantity_applied').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('quotation_lines_version_idx').on(t.versionId, t.sortOrder)],
)

/**
 * An invoice is a financial document, not a quote with a new label. It has its
 * own number, due date and status, and points at the frozen quotation it was
 * raised from. Nothing here is recomputed from live catalogue prices.
 */
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'set null' }),
    number: text('number').notNull(),
    status: invoiceStatus('status').notNull().default('issued'),
    amountPaise: integer('amount_paise').notNull(),
    taxPaise: integer('tax_paise').notNull().default(0),
    dueOn: date('due_on'),
    notes: text('notes'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('invoices_org_number_key').on(t.orgId, t.number),
    index('invoices_org_status_due_idx').on(t.orgId, t.status, t.dueOn),
    index('invoices_org_event_idx').on(t.orgId, t.eventId),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'set null' }),
    invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    amountPaise: integer('amount_paise').notNull(),
    mode: text('mode').notNull().default('upi'),
    gatewayRef: text('gateway_ref'),
    status: paymentStatus('status').notNull().default('pending'),
    /** Unique so a replayed webhook cannot double-credit a balance. */
    idempotencyKey: text('idempotency_key'),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    recordedBy: uuid('recorded_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payments_idempotency_key').on(t.idempotencyKey),
    index('payments_org_created_idx').on(t.orgId, t.createdAt),
    index('payments_org_invoice_idx').on(t.orgId, t.invoiceId),
  ],
)

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    storagePath: text('storage_path').notNull(),
    mime: text('mime').notNull(),
    bytes: integer('bytes').notNull().default(0),
    sha256: text('sha256'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('documents_org_kind_idx').on(t.orgId, t.kind)],
)

/** Capacity is derived by counting events for the date. Only the block is stored. */
export const availabilityBlocks = pgTable(
  'availability_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    status: text('status').notNull().default('blocked'),
    reason: text('reason'),
  },
  (t) => [uniqueIndex('availability_blocks_org_date_key').on(t.orgId, t.date)],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    kind: text('kind').notNull(),
    channel: text('channel').notNull().default('in_app'),
    status: text('status').notNull().default('queued'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    attempts: integer('attempts').notNull().default(0),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_org_status_idx').on(t.orgId, t.status, t.createdAt)],
)

/** No PII. Feeds activation and the north-star metric without a vendor. */
export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    props: jsonb('props').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('usage_events_org_name_idx').on(t.orgId, t.name, t.createdAt)],
)

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before').$type<Record<string, unknown>>(),
    after: jsonb('after').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_events_org_created_idx').on(t.orgId, t.createdAt)],
)

export type Organisation = typeof organisations.$inferSelect
export type Membership = typeof memberships.$inferSelect
export type Business = typeof businesses.$inferSelect
export type BusinessService = typeof businessServices.$inferSelect
export type ServiceItem = typeof serviceItems.$inferSelect
export type ServicePackage = typeof servicePackages.$inferSelect
export type Client = typeof clients.$inferSelect
export type EventRecord = typeof events.$inferSelect
export type Quotation = typeof quotations.$inferSelect
export type QuotationVersion = typeof quotationVersions.$inferSelect
export type QuotationLine = typeof quotationLines.$inferSelect
export type Payment = typeof payments.$inferSelect

/** Per-organisation, per-year quote numbering, incremented atomically in SQL. */
export const quoteCounters = pgTable(
  'quote_counters',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    value: integer('value').notNull().default(0),
  },
  (t) => [uniqueIndex('quote_counters_org_year_key').on(t.orgId, t.year)],
)

/** Stock is the sum of movements. There is no mutable on-hand column to drift. */
export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** kg | ltr | pcs | dozen | pack — a label, quantities stay integer milli-units. */
    unit: text('unit').notNull().default('kg'),
    reorderLevelMilli: integer('reorder_level_milli').notNull().default(0),
    costPaisePerUnit: integer('cost_paise_per_unit'),
    supplier: text('supplier'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('inventory_items_org_name_idx').on(t.orgId, t.active, t.name)],
)

/** Append-only. A correction is a reversing movement, never an update. */
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    /** Signed thousandths of a unit: +1500 = 1.5 kg received. */
    deltaMilli: integer('delta_milli').notNull(),
    reason: text('reason').notNull(),
    note: text('note'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('inventory_movements_org_item_idx').on(t.orgId, t.itemId, t.createdAt)],
)

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: memberRole('role').notNull().default('employee'),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    invitedBy: uuid('invited_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('invitations_token_key').on(t.token),
    index('invitations_org_email_idx').on(t.orgId, t.email),
  ],
)

/** A supplier is a record, not a text field, so purchases can point at it. */
export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    phone: text('phone'),
    notes: text('notes'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('suppliers_org_active_name_idx').on(t.orgId, t.active, t.name)],
)

/** Append-only money out. A correction is a new row, never an edit. */
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    category: text('category').notNull().default('other'),
    amountPaise: integer('amount_paise').notNull(),
    note: text('note'),
    incurredOn: date('incurred_on').notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('expenses_org_date_idx').on(t.orgId, t.incurredOn),
    index('expenses_org_event_idx').on(t.orgId, t.eventId),
  ],
)

/** The run-of-show checklist. Status is a short vocabulary, not a workflow engine. */
export const eventTasks = pgTable(
  'event_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    ownerMembershipId: uuid('owner_membership_id').references(() => memberships.id, {
      onDelete: 'set null',
    }),
    dueOn: date('due_on'),
    status: text('status').notNull().default('todo'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('event_tasks_org_event_status_idx').on(t.orgId, t.eventId, t.status, t.dueOn)],
)

export const eventVendors = pgTable(
  'event_vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    amountPaise: integer('amount_paise').notNull().default(0),
    status: text('status').notNull().default('booked'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('event_vendors_org_event_idx').on(t.orgId, t.eventId, t.status)],
)

export const eventStaff = pgTable(
  'event_staff',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    roleLabel: text('role_label'),
    shiftStart: text('shift_start'),
    shiftEnd: text('shift_end'),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('event_staff_event_member_key').on(t.eventId, t.membershipId),
    index('event_staff_org_member_idx').on(t.orgId, t.membershipId),
  ],
)

/** Completed work that feeds the public page. Not every photo ever taken. */
export const portfolioItems = pgTable(
  'portfolio_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    eventDate: date('event_date'),
    venueName: text('venue_name'),
    description: text('description'),
    coverPath: text('cover_path'),
    published: boolean('published').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('portfolio_items_org_published_idx').on(t.orgId, t.published, t.eventDate)],
)
