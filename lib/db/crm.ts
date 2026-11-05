import 'server-only'
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import {
  clients,
  enquiries,
  events,
  invoices,
  payments,
  quotationVersions,
  quotations,
} from './schema'
import type {
  ClientDetail,
  ClientPage,
  ClientRow,
  EnquiryPage,
  EnquiryRow,
  EnquiryStatus,
} from '@/lib/domain/ops'
import { ENQUIRY_STATUSES } from '@/lib/domain/ops'
import {
  demoAcceptedQuotes,
  demoClients,
  demoEnquiries,
  demoEvents,
  demoInvoices,
} from '@/lib/demo/workspace'
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
        clientId: enquiries.clientId,
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
      clientId: row.clientId,
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
    return demoClients.map((row) => ({ id: row.id, name: row.name, phone: row.phone }))
  }

  return getDb()
    .select({ id: clients.id, name: clients.name, phone: clients.phone })
    .from(clients)
    .where(eq(clients.orgId, orgId))
    .orderBy(clients.name)
    .limit(200)
}

export async function getClientPage(
  orgId: string,
  demo: boolean,
  filters: { q?: string; page: number },
): Promise<ClientPage> {
  const term = filters.q?.trim()
  if (demo || !isDatabaseConfigured()) {
    const lower = term?.toLowerCase()
    const rows = lower
      ? demoClients.filter((row) =>
          [row.name, row.phone, row.email].some((value) => value?.toLowerCase().includes(lower)),
        )
      : demoClients
    return {
      rows: rows.slice(pageOffset(filters.page), pageOffset(filters.page) + PAGE_SIZE),
      total: rows.length,
      page: filters.page,
      pageSize: PAGE_SIZE,
    }
  }

  const db = getDb()
  const conditions: SQL[] = [eq(clients.orgId, orgId)]
  if (term) {
    const like = `%${term}%`
    const search = or(
      ilike(clients.name, like),
      ilike(clients.phone, like),
      ilike(clients.email, like),
    )
    if (search) conditions.push(search)
  }
  const where = and(...conditions)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        source: clients.source,
        enquiries: sql<number>`(
          select count(*)::int from ${enquiries}
          where ${enquiries.clientId} = ${clients.id}
        )`,
        events: sql<number>`(
          select count(*)::int from ${events}
          where ${events.clientId} = ${clients.id}
        )`,
        lastActivity: sql<string>`coalesce(
          (select max(${enquiries.createdAt})::date::text from ${enquiries}
           where ${enquiries.clientId} = ${clients.id}),
          ${clients.createdAt}::date::text
        )`,
      })
      .from(clients)
      .where(where)
      .orderBy(desc(clients.createdAt))
      .limit(PAGE_SIZE)
      .offset(pageOffset(filters.page)),
    db.select({ n: sql<number>`count(*)::int` }).from(clients).where(where),
  ])

  return {
    rows,
    total: totalRows[0]?.n ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
  }
}

export async function getClientDetail(
  orgId: string,
  demo: boolean,
  clientId: string,
): Promise<ClientDetail | null> {
  if (demo || !isDatabaseConfigured()) {
    const client = demoClients.find((row) => row.id === clientId)
    if (!client) return null
    return {
      ...client,
      notes: null,
      createdAt: client.lastActivity,
      enquiries: demoEnquiries
        .filter((row) => row.clientName === client.name)
        .map((row) => ({
          id: row.id,
          eventType: row.eventType,
          eventDate: row.eventDate,
          guests: row.guests,
          status: row.status,
          createdAt: row.createdAt,
        })),
      events: demoEvents
        .filter((row) => row.clientName === client.name)
        .map((row) => ({
          id: row.id,
          title: row.title,
          eventDate: row.eventDate,
          status: row.status,
          guests: row.guests,
          venueName: row.venueName,
        })),
      quotes: demoAcceptedQuotes
        .filter((row) => row.eventTitle.includes(client.name.split(' ')[0] ?? ''))
        .map((row) => ({
          id: row.id,
          number: row.number,
          status: 'accepted',
          eventDate: '',
          totalPaise: row.amountPaise,
        })),
      invoices: demoInvoices
        .filter((row) => row.clientName === client.name)
        .map((row) => ({
          id: row.id,
          number: row.number,
          status: row.status,
          amountPaise: row.amountPaise,
          paidPaise: row.paidPaise,
          dueOn: row.dueOn,
        })),
    }
  }

  const db = getDb()
  const [row] = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      source: clients.source,
      notes: clients.notes,
      createdAt: clients.createdAt,
      enquiries: sql<number>`(
        select count(*)::int from ${enquiries}
        where ${enquiries.clientId} = ${clients.id}
      )`,
      events: sql<number>`(
        select count(*)::int from ${events}
        where ${events.clientId} = ${clients.id}
      )`,
      lastActivity: sql<string>`coalesce(
        (select max(${enquiries.createdAt})::date::text from ${enquiries}
         where ${enquiries.clientId} = ${clients.id}),
        ${clients.createdAt}::date::text
      )`,
    })
    .from(clients)
    .where(and(eq(clients.orgId, orgId), eq(clients.id, clientId)))
    .limit(1)

  if (!row) return null

  const [enquiryRows, eventRows, quoteRows, invoiceRows] = await Promise.all([
    db
      .select({
        id: enquiries.id,
        eventType: enquiries.eventType,
        eventDate: enquiries.eventDate,
        guests: enquiries.guests,
        status: enquiries.status,
        createdAt: enquiries.createdAt,
      })
      .from(enquiries)
      .where(and(eq(enquiries.orgId, orgId), eq(enquiries.clientId, clientId)))
      .orderBy(desc(enquiries.createdAt))
      .limit(50),
    db
      .select({
        id: events.id,
        title: events.title,
        eventDate: events.eventDate,
        status: events.status,
        guests: events.guests,
        venueName: events.venueName,
      })
      .from(events)
      .where(and(eq(events.orgId, orgId), eq(events.clientId, clientId)))
      .orderBy(desc(events.eventDate))
      .limit(50),
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        status: quotations.status,
        eventDate: events.eventDate,
        totalPaise: sql<number>`coalesce(${quotationVersions.totalPaise}, 0)::int`,
      })
      .from(quotations)
      .innerJoin(events, eq(quotations.eventId, events.id))
      .leftJoin(quotationVersions, eq(quotations.currentVersionId, quotationVersions.id))
      .where(and(eq(quotations.orgId, orgId), eq(events.clientId, clientId)))
      .orderBy(desc(quotations.createdAt))
      .limit(50),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        status: invoices.status,
        amountPaise: invoices.amountPaise,
        dueOn: invoices.dueOn,
        paidPaise: sql<number>`(
          select coalesce(sum(${payments.amountPaise}), 0)::int from ${payments}
          where ${payments.invoiceId} = ${invoices.id} and ${payments.status} = 'captured'
        )`,
      })
      .from(invoices)
      .innerJoin(events, eq(invoices.eventId, events.id))
      .where(and(eq(invoices.orgId, orgId), eq(events.clientId, clientId)))
      .orderBy(desc(invoices.issuedAt))
      .limit(50),
  ])

  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    enquiries: enquiryRows.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    events: eventRows,
    quotes: quoteRows,
    invoices: invoiceRows,
  }
}

export function enquiryStatusCounts(rows: EnquiryRow[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1
  return counts
}
