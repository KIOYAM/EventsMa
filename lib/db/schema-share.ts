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
import { enquiries, events, organisations, serviceItems } from './schema'

/**
 * Public share portal.
 *
 * A share link is an owner-created token. A submission is durable: customer
 * details, one row per service and one row per chosen catalogue item, with the
 * indicative amount frozen at submit time. Nothing here is client-side state.
 */

export const shareLinks = pgTable(
  'share_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** null for a catalogue-wide link that is not tied to one event. */
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    /** 'event' | 'catalogue'. */
    kind: text('kind').notNull().default('event'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revoked: boolean('revoked').notNull().default(false),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('share_links_token_key').on(t.token),
    index('share_links_org_event_idx').on(t.orgId, t.eventId, t.revoked),
  ],
)

export const shareSubmissions = pgTable(
  'share_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    shareLinkId: uuid('share_link_id').references(() => shareLinks.id, { onDelete: 'set null' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'set null' }),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email'),
    clientPhone: text('client_phone'),
    message: text('message'),
    /** 'new' | 'reviewed' | 'quoted' | 'closed'. */
    status: text('status').notNull().default('new'),
    indicativeTotalPaise: integer('indicative_total_paise').notNull().default(0),
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('share_submissions_org_status_idx').on(t.orgId, t.status, t.createdAt),
    index('share_submissions_org_event_idx').on(t.orgId, t.eventId),
    uniqueIndex('share_submissions_link_dedupe_key').on(t.shareLinkId, t.dedupeKey),
  ],
)

export const shareSubmissionServices = pgTable(
  'share_submission_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => shareSubmissions.id, { onDelete: 'cascade' }),
    serviceKey: text('service_key').notNull(),
    status: text('status').notNull().default('requested'),
    indicativePaise: integer('indicative_paise').notNull().default(0),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('share_submission_services_submission_service_key').on(t.submissionId, t.serviceKey),
    index('share_submission_services_org_idx').on(t.orgId, t.serviceKey),
  ],
)

export const shareSubmissionLines = pgTable(
  'share_submission_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    submissionServiceId: uuid('submission_service_id')
      .notNull()
      .references(() => shareSubmissionServices.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => serviceItems.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id'),
    /** Which catering session this dish was chosen for; null for catalogue lines. */
    submissionSessionId: uuid('submission_session_id'),
    categoryName: text('category_name'),
    label: text('label').notNull(),
    unitClass: text('unit_class').notNull().default('FLAT'),
    quantity: integer('quantity').notNull().default(1),
    basis: integer('basis').notNull().default(1),
    unitPricePaise: integer('unit_price_paise').notNull().default(0),
    indicativePaise: integer('indicative_paise').notNull().default(0),
    note: text('note'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('share_submission_lines_org_service_idx').on(t.orgId, t.submissionServiceId, t.sortOrder)],
)

/**
 * One catering session inside a customer submission: the guest count, timings and
 * amount are frozen here, so tightening a rule or renaming a session later cannot
 * rewrite what the customer actually asked for.
 */
export const shareSubmissionSessions = pgTable(
  'share_submission_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => shareSubmissions.id, { onDelete: 'cascade' }),
    eventSessionId: uuid('event_session_id'),
    name: text('name').notNull(),
    sessionDate: date('session_date'),
    startTime: text('start_time'),
    endTime: text('end_time'),
    guests: integer('guests').notNull().default(0),
    dishCount: integer('dish_count').notNull().default(0),
    indicativePaise: integer('indicative_paise').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('share_submission_sessions_org_submission_idx').on(t.orgId, t.submissionId, t.sortOrder),
  ],
)

export type ShareLink = typeof shareLinks.$inferSelect
export type ShareSubmission = typeof shareSubmissions.$inferSelect
export type ShareSubmissionService = typeof shareSubmissionServices.$inferSelect
export type ShareSubmissionLine = typeof shareSubmissionLines.$inferSelect
export type ShareSubmissionSession = typeof shareSubmissionSessions.$inferSelect
