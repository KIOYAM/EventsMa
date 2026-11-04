import 'server-only'
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { clients, enquiries } from './schema'
import type { EnquiryPage, EnquiryRow, EnquiryStatus } from '@/lib/domain/ops'
import { ENQUIRY_STATUSES } from '@/lib/domain/ops'
import { demoEnquiries } from '@/lib/demo/workspace'
import { PAGE_SIZE, pageOffset } from '@/lib/pagination'

interface EnquiryFilters {
  q?: string
  status?: string
  page: number
}

function isStatus(value: string | undefined): value is EnquiryStatus {
  return Boolean(value) && ENQUIRY_STATUSES.some((status) => status === value)
}

function demoPage({ q, status, page }: EnquiryFilters): EnquiryPage {
  const term = q?.trim().toLowerCase()
  const filtered = demoEnquiries.filter((row) => {
    if (status && row.status !== status) return false
    if (!term) return true
    return [row.clientName, row.phone, row.eventType, row.message].some((value) =>
      value?.toLowerCase().includes(term),
    )
  })

  const counts: Record<string, number> = {}
  for (const row of demoEnquiries) counts[row.status] = (counts[row.status] ?? 0) + 1

  return {
    rows: filtered.slice(pageOffset(page), pageOffset(page) + PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    counts,
  }
}

/**
 * One page of enquiries in a single round trip. The status tally is a second
 * grouped query, not one query per tab, and the client join is a join rather
 * than a lookup inside a loop.
 */
export async function getEnquiryPage(
  orgId: string,
  demo: boolean,
  filters: EnquiryFilters,
): Promise<EnquiryPage> {
  if (demo || !isDatabaseConfigured()) return demoPage(filters)

  const db = getDb()
  const conditions: SQL[] = [eq(enquiries.orgId, orgId)]
  if (isStatus(filters.status)) conditions.push(eq(enquiries.status, filters.status))

  const term = filters.q?.trim()
  if (term) {
    const like = `%${term}%`
    const search = or(
      ilike(clients.name, like),
      ilike(clients.phone, like),
      ilike(enquiries.eventType, like),
      ilike(enquiries.message, like),
    )
    if (search) conditions.push(search)
  }

  const where = and(...conditions)

  const [rows, totalRows, counts] = await Promise.all([
    db
      .select({
        id: enquiries.id,
        clientName: clients.name,
        phone: clients.phone,
        eventDate: enquiries.eventDate,
        guests: enquiries.guests,
        eventType: enquiries.eventType,
        status: enquiries.status,
        source: enquiries.source,
        message: enquiries.message,
        nextFollowUpAt: enquiries.nextFollowUpAt,
        createdAt: enquiries.createdAt,
      })
      .from(enquiries)
      .leftJoin(clients, eq(enquiries.clientId, clients.id))
      .where(where)
      .orderBy(desc(enquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset(pageOffset(filters.page)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(enquiries)
      .leftJoin(clients, eq(enquiries.clientId, clients.id))
      .where(where),
    db
      .select({ status: enquiries.status, n: sql<number>`count(*)::int` })
      .from(enquiries)
      .where(eq(enquiries.orgId, orgId))
      .groupBy(enquiries.status),
  ])

  const statusCounts: Record<string, number> = {}
  for (const row of counts) statusCounts[row.status] = row.n

  return {
    rows: rows.map((row) => ({
      id: row.id,
      clientName: row.clientName ?? 'Unnamed enquiry',
      phone: row.phone,
      eventDate: row.eventDate,
      guests: row.guests,
      eventType: row.eventType,
      status: row.status as EnquiryStatus,
      source: row.source,
      message: row.message,
      nextFollowUpAt: row.nextFollowUpAt ? row.nextFollowUpAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
    total: totalRows[0]?.n ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
    counts: statusCounts,
  }
}

export interface ClientOption {
  id: string
  name: string
  phone: string | null
}

export async function getClientOptions(orgId: string, demo: boolean): Promise<ClientOption[]> {
  if (demo || !isDatabaseConfigured()) {
    return demoEnquiries.slice(0, 12).map((row) => ({
      id: row.id,
      name: row.clientName,
      phone: row.phone,
    }))
  }

  return getDb()
    .select({ id: clients.id, name: clients.name, phone: clients.phone })
    .from(clients)
    .where(eq(clients.orgId, orgId))
    .orderBy(clients.name)
    .limit(200)
}

export function enquiryStatusCounts(rows: EnquiryRow[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1
  return counts
}
