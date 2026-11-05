import 'server-only'
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import {
  clients,
  eventStaff,
  eventTasks,
  eventVendors,
  events,
  expenses,
  memberships,
  payments,
  quotationVersions,
  quotations,
} from './schema'
import type {
  CalendarEvent,
  EventCrewRow,
  EventDetail,
  EventPage,
  EventRow,
  EventStatus,
  EventTaskRow,
  EventVendorRow,
  TaskStatus,
} from '@/lib/domain/ops'
import { EVENT_STATUSES } from '@/lib/domain/ops'
import { demoEventDetails, demoEvents, demoStaff } from '@/lib/demo/workspace'
import { PAGE_SIZE, pageOffset } from '@/lib/pagination'

interface EventFilters {
  q?: string
  status?: string
  page: number
}

function isStatus(value: string | undefined): value is EventStatus {
  return Boolean(value) && EVENT_STATUSES.some((status) => status === value)
}

function demoPage({ q, status, page }: EventFilters): EventPage {
  const term = q?.trim().toLowerCase()
  const filtered = demoEvents.filter((row) => {
    if (status && row.status !== status) return false
    if (!term) return true
    return [row.title, row.clientName, row.venueName, row.eventType].some((value) =>
      value?.toLowerCase().includes(term),
    )
  })

  return {
    rows: filtered.slice(pageOffset(page), pageOffset(page) + PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
  }
}

export async function getEventPage(
  orgId: string,
  demo: boolean,
  filters: EventFilters,
): Promise<EventPage> {
  if (demo || !isDatabaseConfigured()) return demoPage(filters)

  const db = getDb()
  const conditions: SQL[] = [eq(events.orgId, orgId)]
  if (isStatus(filters.status)) conditions.push(eq(events.status, filters.status))

  const term = filters.q?.trim()
  if (term) {
    const like = `%${term}%`
    const search = or(
      ilike(events.title, like),
      ilike(events.venueName, like),
      ilike(events.eventType, like),
      ilike(clients.name, like),
    )
    if (search) conditions.push(search)
  }

  const where = and(...conditions)

  // A correlated count keeps the list to one query instead of one per event.
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        clientName: clients.name,
        eventDate: events.eventDate,
        guests: events.guests,
        status: events.status,
        venueName: events.venueName,
        eventType: events.eventType,
        openTasks: sql<number>`(
          select count(*)::int from ${eventTasks}
          where ${eventTasks.eventId} = ${events.id} and ${eventTasks.status} <> 'done'
        )`,
      })
      .from(events)
      .leftJoin(clients, eq(events.clientId, clients.id))
      .where(where)
      .orderBy(asc(events.eventDate))
      .limit(PAGE_SIZE)
      .offset(pageOffset(filters.page)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(events)
      .leftJoin(clients, eq(events.clientId, clients.id))
      .where(where),
  ])

  return {
    rows: rows.map((row) => ({
      ...row,
      status: row.status as EventStatus,
    })),
    total: totalRows[0]?.n ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
  }
}

export async function getEventCalendar(
  orgId: string,
  demo: boolean,
  month: string,
): Promise<CalendarEvent[]> {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) return []
  const year = Number(match[1])
  const monthIndex = Number(match[2])
  if (monthIndex < 1 || monthIndex > 12) return []
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  const start = `${month}-01`
  const end = `${month}-${String(lastDay).padStart(2, '0')}`

  if (demo || !isDatabaseConfigured()) {
    return demoEvents
      .filter((event) => event.eventDate >= start && event.eventDate <= end)
      .map((event) => ({
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        status: event.status,
        guests: event.guests,
        venueName: event.venueName,
      }))
  }

  return getDb()
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      status: events.status,
      guests: events.guests,
      venueName: events.venueName,
    })
    .from(events)
    .where(
      and(eq(events.orgId, orgId), gte(events.eventDate, start), lte(events.eventDate, end)),
    )
    .orderBy(asc(events.eventDate), asc(events.title))
    .limit(200)
    .then((rows) => rows.map((row) => ({ ...row, status: row.status as EventStatus })))
}

export async function getEventDetail(
  orgId: string,
  demo: boolean,
  eventId: string,
): Promise<EventDetail | null> {
  if (demo || !isDatabaseConfigured()) {
    const existing = demoEventDetails[eventId]
    if (existing) return existing
    const row = demoEvents.find((event) => event.id === eventId)
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      clientName: row.clientName,
      clientPhone: null,
      clientId: null,
      eventDate: row.eventDate,
      startTime: null,
      endTime: null,
      venueName: row.venueName,
      venueAddress: null,
      guests: row.guests,
      status: row.status,
      eventType: row.eventType,
      notes: null,
      tasks: [],
      vendors: [],
      crew: [],
      quotes: [],
      expensesPaise: 0,
      paidPaise: 0,
    }
  }

  const db = getDb()
  const [row] = await db
    .select({
      id: events.id,
      title: events.title,
      clientId: events.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      eventDate: events.eventDate,
      startTime: events.startTime,
      endTime: events.endTime,
      venueName: events.venueName,
      venueAddress: events.venueAddress,
      guests: events.guests,
      status: events.status,
      eventType: events.eventType,
      notes: events.notes,
    })
    .from(events)
    .leftJoin(clients, eq(events.clientId, clients.id))
    .where(and(eq(events.orgId, orgId), eq(events.id, eventId)))
    .limit(1)

  if (!row) return null

  const [tasks, vendors, crew, quoteRows, expenseRows, paidRows] = await Promise.all([
    db
      .select({
        id: eventTasks.id,
        title: eventTasks.title,
        ownerName: memberships.displayName,
        dueOn: eventTasks.dueOn,
        status: eventTasks.status,
      })
      .from(eventTasks)
      .leftJoin(memberships, eq(eventTasks.ownerMembershipId, memberships.id))
      .where(and(eq(eventTasks.orgId, orgId), eq(eventTasks.eventId, eventId)))
      .orderBy(asc(eventTasks.dueOn), asc(eventTasks.sortOrder)),
    db
      .select({
        id: eventVendors.id,
        name: eventVendors.name,
        category: eventVendors.category,
        amountPaise: eventVendors.amountPaise,
        status: eventVendors.status,
        note: eventVendors.note,
      })
      .from(eventVendors)
      .where(and(eq(eventVendors.orgId, orgId), eq(eventVendors.eventId, eventId)))
      .orderBy(asc(eventVendors.name)),
    db
      .select({
        id: eventStaff.id,
        membershipId: eventStaff.membershipId,
        name: memberships.displayName,
        roleLabel: eventStaff.roleLabel,
        shiftStart: eventStaff.shiftStart,
        shiftEnd: eventStaff.shiftEnd,
        checkedInAt: eventStaff.checkedInAt,
      })
      .from(eventStaff)
      .innerJoin(memberships, eq(eventStaff.membershipId, memberships.id))
      .where(and(eq(eventStaff.orgId, orgId), eq(eventStaff.eventId, eventId)))
      .orderBy(asc(memberships.displayName)),
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        status: quotations.status,
        totalPaise: quotationVersions.totalPaise,
      })
      .from(quotations)
      .leftJoin(quotationVersions, eq(quotations.currentVersionId, quotationVersions.id))
      .where(and(eq(quotations.orgId, orgId), eq(quotations.eventId, eventId)))
      .orderBy(desc(quotations.createdAt)),
    db
      .select({ n: sql<number>`coalesce(sum(${expenses.amountPaise}), 0)::int` })
      .from(expenses)
      .where(and(eq(expenses.orgId, orgId), eq(expenses.eventId, eventId))),
    db
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(
        and(
          eq(payments.orgId, orgId),
          eq(payments.eventId, eventId),
          eq(payments.status, 'captured'),
        ),
      ),
  ])

  return {
    ...row,
    status: row.status as EventStatus,
    tasks: tasks.map((task) => ({
      ...task,
      status: task.status as TaskStatus,
    })),
    vendors: vendors as EventVendorRow[],
    crew: crew.map((member) => ({
      ...member,
      name: member.name ?? 'Member',
      checkedInAt: member.checkedInAt ? member.checkedInAt.toISOString() : null,
    })),
    quotes: quoteRows.map((quote) => ({ ...quote, totalPaise: quote.totalPaise ?? 0 })),
    expensesPaise: expenseRows[0]?.n ?? 0,
    paidPaise: paidRows[0]?.n ?? 0,
  }
}

export async function getEventFormOptions(
  orgId: string,
  demo: boolean,
): Promise<{ clients: { id: string; name: string }[]; staff: typeof demoStaff }> {
  if (demo || !isDatabaseConfigured()) {
    return {
      clients: demoEvents.map((row) => ({ id: row.id, name: row.clientName ?? row.title })),
      staff: demoStaff,
    }
  }

  const db = getDb()
  const [clientRows, staffRows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.orgId, orgId))
      .orderBy(clients.name)
      .limit(200),
    db
      .select({
        id: memberships.id,
        name: sql<string>`coalesce(${memberships.displayName}, ${memberships.email}, 'Member')`,
        role: memberships.role,
        skills: memberships.skills,
      })
      .from(memberships)
      .where(and(eq(memberships.orgId, orgId), eq(memberships.status, 'active')))
      .orderBy(asc(memberships.displayName)),
  ])

  return { clients: clientRows, staff: staffRows }
}

/** The field employee's view: only events they are assigned to, no prices. */
export async function getAssignedEvents(
  orgId: string,
  demo: boolean,
  membershipId: string,
): Promise<{ id: string; title: string; eventDate: string; venueName: string | null; roleLabel: string | null; openTasks: number }[]> {
  if (demo || !isDatabaseConfigured()) {
    return demoEvents.slice(0, 2).map((row, index) => ({
      id: row.id,
      title: row.title,
      eventDate: row.eventDate,
      venueName: row.venueName,
      roleLabel: index === 0 ? 'Counter lead' : 'Floor manager',
      openTasks: row.openTasks,
    }))
  }

  const db = getDb()
  return db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      venueName: events.venueName,
      roleLabel: eventStaff.roleLabel,
      openTasks: sql<number>`(
        select count(*)::int from ${eventTasks}
        where ${eventTasks.eventId} = ${events.id}
          and ${eventTasks.status} <> 'done'
          and (${eventTasks.ownerMembershipId} = ${membershipId} or ${eventTasks.ownerMembershipId} is null)
      )`,
    })
    .from(eventStaff)
    .innerJoin(events, eq(eventStaff.eventId, events.id))
    .where(and(eq(eventStaff.orgId, orgId), eq(eventStaff.membershipId, membershipId)))
    .orderBy(asc(events.eventDate))
    .limit(30)
}
