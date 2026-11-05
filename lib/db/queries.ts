import 'server-only'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import {
  businessServices,
  businesses,
  clients,
  events,
  quotationLines,
  quotationVersions,
  quotations,
  serviceItems,
  servicePackages,
} from './schema'
import { demoBusiness, demoComputation, demoItems, demoQuotes, demoServices } from '@/lib/demo/data'
import type { UnitClass } from '@/lib/domain/units'
import type { PaymentDetails } from '@/lib/domain/ops'
import { EMPTY_PAYMENT_DETAILS, paymentDetailsFrom } from '@/lib/domain/payments'
import { EnabledService, buildServiceNavigation } from '@/lib/domain/service-registry'
import { verticalDescriptor } from '@/lib/domain/verticals'

export interface ServiceRow {
  verticalKey: string
  enabled: boolean
  config: Record<string, string>
  itemCount: number
}

export interface QuoteRow {
  id: string
  number: string
  title: string
  clientName: string
  eventDate: string
  guests: number
  status: string
  totalPaise: number
  marginBp: number
  services: string[]
}

export interface WorkspaceSummary {
  demo: boolean
  business: {
    name: string
    tagline: string | null
    city: string | null
    phone: string | null
    published: boolean
    advancePct: number
  } | null
  services: ServiceRow[]
  quotes: QuoteRow[]
  stats: {
    pipelinePaise: number
    sentCount: number
    upcomingCount: number
    marginBp: number
  }
}

const DAY_MS = 86_400_000

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10)
}

export function demoWorkspace(): WorkspaceSummary {
  const pipelinePaise = demoQuotes
    .filter((q) => q.status === 'sent' || q.status === 'draft')
    .reduce((sum, q) => sum + q.totalPaise, 0)

  return {
    demo: true,
    business: {
      name: demoBusiness.name,
      tagline: demoBusiness.tagline,
      city: demoBusiness.city,
      phone: demoBusiness.phone,
      published: demoBusiness.published,
      advancePct: demoBusiness.settings.advancePct,
    },
    services: demoServices.map((s) => ({
      verticalKey: s.verticalKey,
      enabled: s.enabled,
      config: s.config as Record<string, string>,
      itemCount: demoItems.filter((i) => i.verticalKey === s.verticalKey).length,
    })),
    quotes: demoQuotes.map((q) => ({
      id: q.id,
      number: q.number,
      title: q.title,
      clientName: q.clientName,
      eventDate: q.eventDate,
      guests: q.guests,
      status: q.status,
      totalPaise: q.totalPaise,
      marginBp: q.marginBp,
      services: q.services,
    })),
    stats: {
      pipelinePaise,
      sentCount: demoQuotes.filter((q) => q.status === 'sent').length,
      upcomingCount: demoQuotes.filter((q) => q.eventDate >= daysFromNow(0)).length,
      marginBp: 3100,
    },
  }
}

/** One round trip per tile, issued in parallel. Only the columns the screen renders. */
export async function getWorkspaceSummary(orgId: string, demo: boolean): Promise<WorkspaceSummary> {
  if (demo || !isDatabaseConfigured()) return demoWorkspace()

  const db = getDb()
  const today = daysFromNow(0)

  const [businessRow, serviceRows, itemCounts, quoteRows, upcomingCountRows] = await Promise.all([
    db
      .select({
        name: businesses.name,
        tagline: businesses.tagline,
        city: businesses.city,
        phone: businesses.phone,
        published: businesses.published,
        settings: businesses.settings,
      })
      .from(businesses)
      .where(eq(businesses.orgId, orgId))
      .limit(1),
    db
      .select({
        verticalKey: businessServices.verticalKey,
        enabled: businessServices.enabled,
        config: businessServices.config,
      })
      .from(businessServices)
      .where(eq(businessServices.orgId, orgId))
      .orderBy(businessServices.sortOrder),
    db
      .select({ verticalKey: serviceItems.verticalKey, count: sql<number>`count(*)::int` })
      .from(serviceItems)
      .where(and(eq(serviceItems.orgId, orgId), eq(serviceItems.active, true)))
      .groupBy(serviceItems.verticalKey),
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        status: quotations.status,
        title: events.title,
        eventDate: events.eventDate,
        guests: quotationVersions.guests,
        totalPaise: quotationVersions.totalPaise,
        marginPaise: quotationVersions.marginPaise,
        taxableBasePaise: sql<number>`(${quotationVersions.totalPaise} - ${quotationVersions.taxPaise})::int`,
      })
      .from(quotations)
      .innerJoin(events, eq(quotations.eventId, events.id))
      .leftJoin(quotationVersions, eq(quotations.currentVersionId, quotationVersions.id))
      .where(eq(quotations.orgId, orgId))
      .orderBy(desc(quotations.createdAt))
      .limit(20),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(and(eq(events.orgId, orgId), gte(events.eventDate, today))),
  ])

  const business = businessRow[0]
  const counts = new Map(itemCounts.map((r) => [r.verticalKey, r.count]))

  const quotes: QuoteRow[] = quoteRows.map((row) => {
    const total = row.totalPaise ?? 0
    const taxable = row.taxableBasePaise ?? 0
    const marginBp =
      row.marginPaise != null && taxable > 0 ? Math.round((row.marginPaise * 10_000) / taxable) : 0

    return {
      id: row.id,
      number: row.number,
      title: row.title,
      clientName: '—',
      eventDate: row.eventDate,
      guests: row.guests ?? 0,
      status: row.status,
      totalPaise: total,
      marginBp,
      services: [],
    }
  })

  return {
    demo: false,
    business: business
      ? {
          name: business.name,
          tagline: business.tagline,
          city: business.city,
          phone: business.phone,
          published: business.published,
          advancePct: business.settings.advancePct ?? 30,
        }
      : null,
    services: serviceRows.map((s) => ({
      verticalKey: s.verticalKey,
      enabled: s.enabled,
      config: s.config,
      itemCount: counts.get(s.verticalKey) ?? 0,
    })),
    quotes,
    stats: {
      pipelinePaise: quotes
        .filter((q) => q.status === 'sent' || q.status === 'draft')
        .reduce((sum, q) => sum + q.totalPaise, 0),
      sentCount: quotes.filter((q) => q.status === 'sent').length,
      upcomingCount: upcomingCountRows[0]?.count ?? 0,
      marginBp: quotes.length
        ? Math.round(quotes.reduce((sum, q) => sum + q.marginBp, 0) / quotes.length)
        : 0,
    },
  }
}

export interface ComposerItem {
  id: string
  verticalKey: string
  name: string
  unitClass: UnitClass
  unitLabel: string | null
  pricePaise: number
  costPaise: number | null
  taxRateBp: number
}

export interface ComposerData {
  demo: boolean
  services: { verticalKey: string; config: Record<string, string> }[]
  items: ComposerItem[]
  packages: { id: string; verticalKey: string; name: string; unitClass: UnitClass; ratePaise: number; minQuantity: number; taxRateBp: number }[]
  clients: { id: string; name: string; phone: string | null }[]
}

export function demoComposerData(): ComposerData {
  return {
    demo: true,
    services: demoServices.map((s) => ({ verticalKey: s.verticalKey, config: s.config as Record<string, string> })),
    items: demoItems.map((i) => ({
      id: i.id,
      verticalKey: i.verticalKey,
      name: i.name,
      unitClass: i.unitClass,
      unitLabel: null,
      pricePaise: i.pricePaise,
      costPaise: i.costPaise,
      taxRateBp: i.taxRateBp,
    })),
    packages: [],
    clients: [
      { id: '00000000-0000-4000-8000-0000000000c1', name: 'Meera & Karthik', phone: '+91 98420 11452' },
      { id: '00000000-0000-4000-8000-0000000000c2', name: 'Srinivasan Family', phone: '+91 97877 21036' },
      { id: '00000000-0000-4000-8000-0000000000c3', name: 'Pranav Tech Solutions', phone: '+91 90031 87640' },
    ],
  }
}

export async function getComposerData(orgId: string, demo: boolean): Promise<ComposerData> {
  if (demo || !isDatabaseConfigured()) return demoComposerData()

  const db = getDb()
  const [services, items, packages, clientRows] = await Promise.all([
    db
      .select({ verticalKey: businessServices.verticalKey, config: businessServices.config })
      .from(businessServices)
      .where(and(eq(businessServices.orgId, orgId), eq(businessServices.enabled, true)))
      .orderBy(businessServices.sortOrder),
    db
      .select({
        id: serviceItems.id,
        verticalKey: serviceItems.verticalKey,
        name: serviceItems.name,
        unitClass: serviceItems.unitClass,
        unitLabel: serviceItems.unitLabel,
        pricePaise: serviceItems.pricePaise,
        costPaise: serviceItems.costPaise,
        taxRateBp: serviceItems.taxRateBp,
      })
      .from(serviceItems)
      .where(and(eq(serviceItems.orgId, orgId), eq(serviceItems.active, true)))
      .orderBy(serviceItems.verticalKey, serviceItems.name)
      .limit(400),
    db
      .select({
        id: servicePackages.id,
        verticalKey: servicePackages.verticalKey,
        name: servicePackages.name,
        unitClass: servicePackages.unitClass,
        ratePaise: servicePackages.ratePaise,
        minQuantity: servicePackages.minQuantity,
        taxRateBp: servicePackages.taxRateBp,
      })
      .from(servicePackages)
      .where(and(eq(servicePackages.orgId, orgId), eq(servicePackages.active, true)))
      .limit(100),
    db
      .select({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients)
      .where(eq(clients.orgId, orgId))
      .orderBy(clients.name)
      .limit(200),
  ])

  return {
    demo: false,
    services,
    items: items.map((i) => ({ ...i, unitClass: i.unitClass as UnitClass })),
    packages: packages.map((p) => ({ ...p, unitClass: p.unitClass as UnitClass })),
    clients: clientRows,
  }
}

export interface QuoteDocument {
  id: string
  number: string
  status: string
  publicToken: string | null
  tokenExpiresAt: string | null
  acceptedAt: string | null
  acceptedByEmail: string | null
  title: string
  eventDate: string
  venueName: string | null
  guests: number
  businessName: string
  businessPhone: string | null
  payment: PaymentDetails
  serviceGroups: {
    serviceKey: string
    lines: {
      label: string
      unitClass: UnitClass
      basis: number
      unitRatePaise: number
      grossPaise: number
      taxPaise: number
      totalPaise: number
      included: boolean
    }[]
    subtotalPaise: number
  }[]
  subtotalPaise: number
  discountPaise: number
  taxPaise: number
  roundOffPaise: number
  totalPaise: number
  marginPaise: number
  marginBp: number
}

export function demoQuoteDocument(): QuoteDocument {
  const computed = demoComputation()
  const groups = new Map<string, QuoteDocument['serviceGroups'][number]>()

  for (const line of computed.lines) {
    const existing = groups.get(line.serviceKey) ?? {
      serviceKey: line.serviceKey,
      lines: [],
      subtotalPaise: 0,
    }
    existing.lines.push({
      label: line.label,
      unitClass: line.unitClass,
      basis: line.basis,
      unitRatePaise: line.unitRatePaise,
      grossPaise: line.grossPaise,
      taxPaise: line.taxPaise,
      totalPaise: line.totalPaise,
      included: line.included,
    })
    existing.subtotalPaise += line.grossPaise
    groups.set(line.serviceKey, existing)
  }

  return {
    id: '00000000-0000-4000-8000-0000000000d1',
    number: 'QT-2026-0041',
    status: 'sent',
    publicToken: 'demo-quote-token',
    tokenExpiresAt: null,
    acceptedAt: null,
    acceptedByEmail: null,
    title: 'Meera & Karthik - Wedding lunch',
    eventDate: daysFromNow(10),
    venueName: 'Sree Lakshmi Mahal, Peelamedu',
    guests: 350,
    businessName: demoBusiness.name,
    businessPhone: demoBusiness.phone,
    payment: {
      ...EMPTY_PAYMENT_DETAILS,
      instructions: 'Demo only. No money is collected from this page.',
    },
    serviceGroups: [...groups.values()],
    subtotalPaise: computed.subtotalPaise,
    discountPaise: computed.discountPaise,
    taxPaise: computed.taxPaise,
    roundOffPaise: computed.roundOffPaise,
    totalPaise: computed.totalPaise,
    marginPaise: computed.marginPaise,
    marginBp: computed.marginBp,
  }
}

export async function getQuoteDocument(
  orgId: string,
  quotationId: string,
  demo: boolean,
): Promise<QuoteDocument | null> {
  if (demo || !isDatabaseConfigured()) return demoQuoteDocument()

  const db = getDb()
  const [row] = await db
    .select({
      id: quotations.id,
      number: quotations.number,
      status: quotations.status,
      publicToken: quotations.publicToken,
      tokenExpiresAt: quotations.tokenExpiresAt,
      acceptedAt: quotations.acceptedAt,
      acceptedByEmail: quotations.acceptedByEmail,
      versionId: quotationVersions.id,
      title: events.title,
      eventDate: events.eventDate,
      venueName: events.venueName,
      guests: quotationVersions.guests,
      subtotalPaise: quotationVersions.subtotalPaise,
      discountPaise: quotationVersions.discountPaise,
      taxPaise: quotationVersions.taxPaise,
      roundOffPaise: quotationVersions.roundOffPaise,
      totalPaise: quotationVersions.totalPaise,
      costPaise: quotationVersions.costPaise,
      marginPaise: quotationVersions.marginPaise,
      businessName: businesses.name,
      businessPhone: businesses.phone,
      businessSettings: businesses.settings,
    })
    .from(quotations)
    .innerJoin(events, eq(quotations.eventId, events.id))
    .innerJoin(businesses, eq(quotations.orgId, businesses.orgId))
    .innerJoin(quotationVersions, eq(quotations.currentVersionId, quotationVersions.id))
    .where(and(eq(quotations.orgId, orgId), eq(quotations.id, quotationId)))
    .limit(1)

  if (!row) return null

  const lines = await db
    .select({
      serviceKey: quotationLines.serviceKey,
      label: quotationLines.label,
      unitClass: quotationLines.unitClass,
      basis: quotationLines.basis,
      unitRatePaise: quotationLines.unitRatePaise,
      grossPaise: quotationLines.grossPaise,
      taxPaise: quotationLines.taxPaise,
      totalPaise: quotationLines.totalPaise,
      included: quotationLines.included,
    })
    .from(quotationLines)
    .where(eq(quotationLines.versionId, row.versionId))
    .orderBy(quotationLines.sortOrder)

  const groups = new Map<string, QuoteDocument['serviceGroups'][number]>()
  for (const line of lines) {
    const existing = groups.get(line.serviceKey) ?? {
      serviceKey: line.serviceKey,
      lines: [],
      subtotalPaise: 0,
    }
    existing.lines.push({
      label: line.label,
      unitClass: line.unitClass as UnitClass,
      basis: line.basis,
      unitRatePaise: line.unitRatePaise,
      grossPaise: line.grossPaise,
      taxPaise: line.taxPaise,
      totalPaise: line.totalPaise,
      included: line.included,
    })
    existing.subtotalPaise += line.grossPaise
    groups.set(line.serviceKey, existing)
  }

  const taxable = row.totalPaise - row.taxPaise
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    publicToken: row.publicToken,
    tokenExpiresAt: row.tokenExpiresAt ? row.tokenExpiresAt.toISOString() : null,
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    acceptedByEmail: row.acceptedByEmail,
    title: row.title,
    eventDate: row.eventDate,
    venueName: row.venueName,
    guests: row.guests,
    businessName: row.businessName,
    businessPhone: row.businessPhone,
    payment: paymentDetailsFrom(row.businessSettings?.payment),
    serviceGroups: [...groups.values()],
    subtotalPaise: row.subtotalPaise,
    discountPaise: row.discountPaise,
    taxPaise: row.taxPaise,
    roundOffPaise: row.roundOffPaise,
    totalPaise: row.totalPaise,
    marginPaise: row.marginPaise,
    marginBp: taxable > 0 ? Math.round((row.marginPaise * 10_000) / taxable) : 0,
  }
}

/** Return every business service for an org, resolved with its vertical descriptor. */
export async function getEnabledServices(
  orgId: string,
  demo: boolean,
): Promise<EnabledService[]> {
  if (demo) {
    return demoServices.map((s) => ({
      key: s.verticalKey,
      label: verticalDescriptor(s.verticalKey).label,
      enabled: s.enabled,
      sortOrder: s.sortOrder,
      config: s.config as Record<string, string>,
      descriptor: verticalDescriptor(s.verticalKey),
    }))
  }

  if (!isDatabaseConfigured()) return []

  const db = getDb()
  const rows = await db
    .select({
      verticalKey: businessServices.verticalKey,
      enabled: businessServices.enabled,
      config: businessServices.config,
      sortOrder: businessServices.sortOrder,
    })
    .from(businessServices)
    .where(eq(businessServices.orgId, orgId))
    .orderBy(businessServices.sortOrder)

  return rows.map((row) => ({
    key: row.verticalKey,
    label: verticalDescriptor(row.verticalKey).label,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    config: row.config ?? {},
    descriptor: verticalDescriptor(row.verticalKey),
  }))
}

/** Build the full navigation rail from enabled services. */
export function serviceNavigation(enabled: readonly EnabledService[]) {
  return buildServiceNavigation(enabled)
}
