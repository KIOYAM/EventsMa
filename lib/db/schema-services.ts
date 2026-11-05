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
import { events, organisations } from './schema'

export const setupStatus = pgEnum('setup_status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
export const appointmentStatus = pgEnum('appointment_status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
export const trialStatus = pgEnum('trial_status', ['scheduled', 'completed', 'approved', 'rejected', 'cancelled'])
export const coverageStatus = pgEnum('coverage_status', ['planned', 'scheduled', 'completed', 'cancelled'])
export const assignmentRole = pgEnum('assignment_role', ['photographer', 'assistant', 'second_shooter'])
export const shotPriority = pgEnum('shot_priority', ['low', 'normal', 'high', 'must_capture'])
export const deliverableStatus = pgEnum('deliverable_status', ['pending', 'editing', 'review', 'delivered', 'revised'])

// -----------------------------------------------------
// Event <-> Service composition
// -----------------------------------------------------
export const eventServices = pgTable(
  'event_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    serviceKey: text('service_key').notNull(),
    serviceRecordId: uuid('service_record_id'),
    status: text('status').notNull().default('planned'),
    configSnapshot: jsonb('config_snapshot').notNull().default({}),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('event_services_org_event_idx').on(t.orgId, t.eventId, t.serviceKey),
    uniqueIndex('event_services_event_service_key_idx').on(t.eventId, t.serviceKey),
  ]
)

// -----------------------------------------------------
// Decoration: areas
// -----------------------------------------------------
export const decorationAreas = pgTable(
  'decoration_areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    areaType: text('area_type').notNull(),
    dimensions: text('dimensions'),
    setupNotes: text('setup_notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('decoration_areas_org_event_idx').on(t.orgId, t.eventId, t.active),
    index('decoration_areas_org_area_type_idx').on(t.orgId, t.areaType),
  ]
)

// -----------------------------------------------------
// Decoration: setups
// -----------------------------------------------------
export const decorationSetups = pgTable(
  'decoration_setups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
    areaId: uuid('area_id').references(() => decorationAreas.id, { onDelete: 'set null' }),
    setupStart: timestamp('setup_start', { withTimezone: true }),
    setupEnd: timestamp('setup_end', { withTimezone: true }),
    teardownStart: timestamp('teardown_start', { withTimezone: true }),
    teardownEnd: timestamp('teardown_end', { withTimezone: true }),
    status: setupStatus('status').notNull().default('scheduled'),
    crewAssigned: text('crew_assigned'),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('decoration_setups_org_event_idx').on(t.orgId, t.eventId, t.status),
    index('decoration_setups_org_date_idx').on(t.orgId, t.setupStart, t.setupEnd),
  ]
)

// -----------------------------------------------------
// Decoration: materials
// -----------------------------------------------------
export const decorationMaterials = pgTable(
  'decoration_materials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    unit: text('unit').notNull(),
    quantityAvailable: integer('quantity_available').notNull().default(0),
    quantityUnit: text('quantity_unit').notNull(),
    costPaisePerUnit: integer('cost_paise_per_unit').notNull().default(0),
    supplier: text('supplier'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('decoration_materials_org_category_idx').on(t.orgId, t.category, t.active)]
)

// -----------------------------------------------------
// Makeup: artists
// -----------------------------------------------------
export const makeupArtists = pgTable(
  'makeup_artists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    skills: text('skills').array().notNull().default([]),
    specializations: text('specializations').array().notNull().default([]),
    portfolioPath: text('portfolio_path'),
    ratePaisePerHour: integer('rate_paise_per_hour').notNull().default(0),
    travelFeePaise: integer('travel_fee_paise').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('makeup_artists_org_active_idx').on(t.orgId, t.active)]
)

// -----------------------------------------------------
// Makeup: appointments
// -----------------------------------------------------
export const makeupAppointments = pgTable(
  'makeup_appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
    artistId: uuid('artist_id').references(() => makeupArtists.id, { onDelete: 'set null' }),
    clientName: text('client_name').notNull(),
    serviceType: text('service_type').notNull(),
    appointmentStart: timestamp('appointment_start', { withTimezone: true }).notNull(),
    appointmentEnd: timestamp('appointment_end', { withTimezone: true }).notNull(),
    location: text('location'),
    travelRequired: boolean('travel_required').notNull().default(false),
    travelFeePaise: integer('travel_fee_paise').notNull().default(0),
    status: appointmentStatus('status').notNull().default('scheduled'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('makeup_appointments_org_event_idx').on(t.orgId, t.eventId, t.status),
    index('makeup_appointments_org_date_idx').on(t.orgId, t.appointmentStart, t.appointmentEnd),
    index('makeup_appointments_artist_idx').on(t.artistId, t.appointmentStart),
  ]
)

// -----------------------------------------------------
// Makeup: trials
// -----------------------------------------------------
export const makeupTrials = pgTable(
  'makeup_trials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
    artistId: uuid('artist_id').references(() => makeupArtists.id, { onDelete: 'set null' }),
    clientName: text('client_name').notNull(),
    trialDate: date('trial_date').notNull(),
    trialStart: timestamp('trial_start', { withTimezone: true }),
    trialEnd: timestamp('trial_end', { withTimezone: true }),
    makeupStyle: text('makeup_style'),
    approved: boolean('approved').notNull().default(false),
    approvalNotes: text('approval_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('makeup_trials_org_event_idx').on(t.orgId, t.eventId, t.approved)]
)

// -----------------------------------------------------
// Photography: coverage
// -----------------------------------------------------
export const photographyCoverage = pgTable(
  'photography_coverage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    coverageType: text('coverage_type').notNull(),
    coverageStart: timestamp('coverage_start', { withTimezone: true }).notNull(),
    coverageEnd: timestamp('coverage_end', { withTimezone: true }).notNull(),
    location: text('location'),
    shotListNotes: text('shot_list_notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('photography_coverage_org_event_idx').on(t.orgId, t.eventId, t.active),
    index('photography_coverage_org_date_idx').on(t.orgId, t.coverageStart, t.coverageEnd),
  ]
)

// -----------------------------------------------------
// Photography: assignments
// -----------------------------------------------------
export const photographyAssignments = pgTable(
  'photography_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    coverageId: uuid('coverage_id').references(() => photographyCoverage.id, {
      onDelete: 'set null',
    }),
    photographerName: text('photographer_name').notNull(),
    role: assignmentRole('role').notNull(),
    equipment: text('equipment'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photography_assignments_org_event_idx').on(t.orgId, t.eventId)]
)

// -----------------------------------------------------
// Photography: shot lists
// -----------------------------------------------------
export const photographyShotLists = pgTable(
  'photography_shot_lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    moment: text('moment').notNull(),
    description: text('description'),
    priority: shotPriority('priority').notNull().default('normal'),
    captured: boolean('captured').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photography_shot_lists_org_event_idx').on(t.orgId, t.eventId, t.captured)]
)

// -----------------------------------------------------
// Photography: deliverables
// -----------------------------------------------------
export const photographyDeliverables = pgTable(
  'photography_deliverables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    deliverableType: text('deliverable_type').notNull(),
    quantity: integer('quantity').notNull().default(1),
    status: deliverableStatus('status').notNull().default('pending'),
    deliveryDate: date('delivery_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photography_deliverables_org_event_idx').on(t.orgId, t.eventId, t.status)]
)

export type EventService = typeof eventServices.$inferSelect
export type DecorationArea = typeof decorationAreas.$inferSelect
export type DecorationSetup = typeof decorationSetups.$inferSelect
export type DecorationMaterial = typeof decorationMaterials.$inferSelect
export type MakeupArtist = typeof makeupArtists.$inferSelect
export type MakeupAppointment = typeof makeupAppointments.$inferSelect
export type MakeupTrial = typeof makeupTrials.$inferSelect
export type PhotographyCoverage = typeof photographyCoverage.$inferSelect
export type PhotographyAssignment = typeof photographyAssignments.$inferSelect
export type PhotographyShotList = typeof photographyShotLists.$inferSelect
export type PhotographyDeliverable = typeof photographyDeliverables.$inferSelect
