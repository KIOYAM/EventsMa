import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { organisations } from './schema'
import { businessServices } from './schema'
import { serviceItems } from './schema'

export interface PlatformOrgRow {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  createdAt: string
  members: number
  eventCount: number
}

const DEMO_ORGS: PlatformOrgRow[] = [
  {
    id: '00000000-0000-4000-8000-00000000c001',
    name: 'Kerala Kitchen Co.',
    slug: 'kerala-kitchen',
    plan: 'growth',
    status: 'active',
    createdAt: '2026-01-12',
    members: 6,
    eventCount: 14,
  },
  {
    id: '00000000-0000-4000-8000-00000000c002',
    name: 'Backwater Events',
    slug: 'backwater-events',
    plan: 'trial',
    status: 'active',
    createdAt: '2026-09-02',
    members: 2,
    eventCount: 3,
  },
]

export async function getPlatformOrgs(demo: boolean): Promise<PlatformOrgRow[]> {
  if (demo || !isDatabaseConfigured()) return DEMO_ORGS

  const rows = await getDb()
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      plan: organisations.plan,
      status: organisations.status,
      createdAt: organisations.createdAt,
      members: sql<number>`(
        select count(*)::int from memberships m where m.org_id = organisations.id
      )`,
      eventCount: sql<number>`(
        select count(*)::int from events e where e.org_id = organisations.id
      )`,
    })
    .from(organisations)
    .orderBy(desc(organisations.createdAt))
    .limit(200)

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    members: Number(row.members),
    eventCount: Number(row.eventCount),
  }))
}

export interface ServiceAdoptionRow {
  verticalKey: string
  label: string
  enabledOrgs: number
  totalOrgs: number
  itemCount: number
}

const DEMO_SERVICE_ADOPTION: ServiceAdoptionRow[] = [
  { verticalKey: 'catering', label: 'Catering & food service', enabledOrgs: 14, totalOrgs: 22, itemCount: 48 },
  { verticalKey: 'decor', label: 'Decoration & styling', enabledOrgs: 11, totalOrgs: 22, itemCount: 26 },
  { verticalKey: 'makeup', label: 'Makeup & beauty', enabledOrgs: 9, totalOrgs: 22, itemCount: 18 },
  { verticalKey: 'photography', label: 'Photography & video', enabledOrgs: 12, totalOrgs: 22, itemCount: 22 },
]

export async function getServiceAdoption(demo: boolean): Promise<ServiceAdoptionRow[]> {
  if (demo || !isDatabaseConfigured()) return DEMO_SERVICE_ADOPTION

  const db = getDb()
  const totalOrgsRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organisations)
    .limit(1)
  const totalOrgs = Number(totalOrgsRow[0]?.count ?? 0)

  const rows = await db
    .select({
      verticalKey: businessServices.verticalKey,
      enabledOrgs: sql<number>`count(distinct case when ${businessServices.enabled} then ${businessServices.orgId} end)::int`,
      itemCount: sql<number>`coalesce((
        select count(*)::int from service_items si where si.vertical_key = businessServices.vertical_key and si.active = true
      ), 0)`,
    })
    .from(businessServices)
    .groupBy(businessServices.verticalKey)

  return rows.map((row) => ({
    verticalKey: row.verticalKey,
    label: row.verticalKey.charAt(0).toUpperCase() + row.verticalKey.slice(1),
    enabledOrgs: Number(row.enabledOrgs),
    totalOrgs,
    itemCount: Number(row.itemCount),
  }))
}

export interface ServiceQuoteRow {
  verticalKey: string
  label: string
  quoteCount: number
  acceptedCount: number
  totalValuePaise: number
}

const DEMO_SERVICE_QUOTES: ServiceQuoteRow[] = [
  { verticalKey: 'catering', label: 'Catering & food service', quoteCount: 240, acceptedCount: 192, totalValuePaise: 8_450_000 },
  { verticalKey: 'decor', label: 'Decoration & styling', quoteCount: 156, acceptedCount: 118, totalValuePaise: 3_200_000 },
  { verticalKey: 'makeup', label: 'Makeup & beauty', quoteCount: 98, acceptedCount: 74, totalValuePaise: 1_650_000 },
  { verticalKey: 'photography', label: 'Photography & video', quoteCount: 112, acceptedCount: 84, totalValuePaise: 2_100_000 },
]

export async function getServiceQuotes(demo: boolean): Promise<ServiceQuoteRow[]> {
  if (demo || !isDatabaseConfigured()) return DEMO_SERVICE_QUOTES

  const db = getDb()
  const rows = await db
    .select({
      verticalKey: quotationLines.serviceKey,
      quoteCount: sql<number>`count(distinct ql.version_id)::int`,
      acceptedCount: sql<number>`count(distinct case when q.status = 'accepted' then ql.version_id end)::int`,
      totalValuePaise: sql<number>`coalesce(sum(ql.total_paise), 0)::int`,
    })
    .from(quotationLines)
    .innerJoin(quotationVersions, eq(quotationLines.versionId, quotationVersions.id))
    .innerJoin(quotations, eq(quotationVersions.quotationId, quotations.id))
    .groupBy(quotationLines.serviceKey)

  return rows.map((row) => ({
    verticalKey: row.verticalKey,
    label: row.verticalKey.charAt(0).toUpperCase() + row.verticalKey.slice(1),
    quoteCount: Number(row.quoteCount),
    acceptedCount: Number(row.acceptedCount),
    totalValuePaise: Number(row.totalValuePaise),
  }))
}

export interface NotificationRow {
  id: string
  orgId: string
  kind: string
  channel: string
  status: string
  attempts: number
  createdAt: string
}

const DEMO_NOTIFICATIONS: NotificationRow[] = [
  { id: 'n1', orgId: 'org-1', kind: 'quote_sent', channel: 'email', status: 'sent', attempts: 1, createdAt: '2026-11-04T10:30:00Z' },
  { id: 'n2', orgId: 'org-2', kind: 'quote_accepted', channel: 'in_app', status: 'sent', attempts: 1, createdAt: '2026-11-04T09:15:00Z' },
  { id: 'n3', orgId: 'org-3', kind: 'invoice_due', channel: 'email', status: 'queued', attempts: 0, createdAt: '2026-11-05T08:00:00Z' },
]

export async function getNotifications(demo: boolean): Promise<NotificationRow[]> {
  if (demo || !isDatabaseConfigured()) return DEMO_NOTIFICATIONS

  const db = getDb()
  const rows = await db
    .select({
      id: notifications.id,
      orgId: notifications.orgId,
      kind: notifications.kind,
      channel: notifications.channel,
      status: notifications.status,
      attempts: notifications.attempts,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(100)

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }))
}

import { quotationLines, quotationVersions, quotations } from './schema'
import { notifications } from './schema'
