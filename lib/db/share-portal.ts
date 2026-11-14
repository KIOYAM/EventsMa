import 'server-only'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { getSystemDb, isDatabaseConfigured } from './client'
import { businesses, businessServices, events, serviceItems } from './schema'
import { eventCateringSessions } from './schema-catering'
import { decorationAreas } from './schema-services'
import { shareLinks } from './schema-share'
import { loadEventMenu } from './share-portal-menu'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { isUnitClass, type UnitClass } from '@/lib/domain/units'
import type { MenuSession } from '@/lib/domain/menu-selection'
import { localiseContent } from '@/lib/domain/translations'
import { loadItemTranslations } from './content-translations'
import type { TranslationLocale } from './schema-translations'

/** One catalogue item a customer can pick. Prices are indicative, not confidential costs. */
export interface PortalItem {
  id: string
  name: string
  description: string | null
  category: string | null
  unitClass: UnitClass
  unitLabel: string | null
  pricePaise: number
  dietary: string | null
  imagePath: string | null
}

export interface PortalCategory {
  name: string
  items: PortalItem[]
}

export interface PortalService {
  key: string
  label: string
  description: string
  categories: PortalCategory[]
  /** Service-specific context: meal sessions for catering, areas for decoration. */
  notes: { label: string; value: string }[]
}

export interface PortalEvent {
  id: string
  title: string
  eventType: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  venueName: string | null
  venueAddress: string | null
  guests: number
}

export interface PortalContact {
  businessName: string
  phone: string | null
  email: string | null
  whatsapp: string | null
  city: string | null
}

export interface SharePortal {
  token: string
  orgId: string
  event: PortalEvent | null
  contact: PortalContact
  services: PortalService[]
  /**
   * The event's planned catering menu, session by session. When this is non-empty
   * the flat `catering` catalogue is withheld from `services`, so the customer
   * chooses from the owner's real plan instead of every active dish.
   */
  menu: MenuSession[]
}

/**
 * Resolve a share token (or, before tokens existed, a raw event id) into the
 * data a customer may see. Returns null for expired or revoked links so the page
 * can 404 rather than leak a stale catalogue.
 */
/**
 * `locale` localises the *business content* the customer reads (dish and category
 * names), never the interface — the page passes the interface language it resolved
 * from the cookie. Omitted, everything renders in the owner's source language, which
 * is what server-side submission handling wants.
 */
export async function getSharePortal(
  token: string,
  locale: TranslationLocale | null = null,
): Promise<SharePortal | null> {
  if (!isDatabaseConfigured() || !token) return null
  const db = getSystemDb()

  // If the share_links migration has not been applied yet, fall back to the
  // legacy event-id behaviour instead of 500-ing every existing link.
  let link: {
    id: string
    orgId: string
    eventId: string | null
    revoked: boolean
    expiresAt: Date | null
  } | null = null
  try {
    const [row] = await db
      .select({
        id: shareLinks.id,
        orgId: shareLinks.orgId,
        eventId: shareLinks.eventId,
        revoked: shareLinks.revoked,
        expiresAt: shareLinks.expiresAt,
      })
      .from(shareLinks)
      .where(eq(shareLinks.token, token))
      .limit(1)
    link = row ?? null
  } catch {
    link = null
  }

  if (link?.revoked) return null
  if (link?.expiresAt && link.expiresAt.getTime() < Date.now()) return null

  // Legacy fallback: the raw event id was shareable before share_links existed.
  // A non-uuid token must 404 here, not reach Postgres and raise a cast error.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const candidate = link?.eventId ?? (link ? null : token)
  if (!candidate || !UUID.test(candidate)) return null

  let event: {
    id: string
    orgId: string
    title: string
    eventType: string | null
    eventDate: string
    startTime: string | null
    endTime: string | null
    venueName: string | null
    venueAddress: string | null
    guests: number
  } | null = null

  try {
    const [row] = await db
      .select({
        id: events.id,
        orgId: events.orgId,
        title: events.title,
        eventType: events.eventType,
        eventDate: events.eventDate,
        startTime: events.startTime,
        endTime: events.endTime,
        venueName: events.venueName,
        venueAddress: events.venueAddress,
        guests: events.guests,
      })
      .from(events)
      .where(eq(events.id, candidate))
      .limit(1)
    event = row ?? null
  } catch {
    return null
  }

  if (!event) return null
  if (link && link.orgId !== event.orgId) return null

  const [business] = await db
    .select({
      name: businesses.name,
      phone: businesses.phone,
      email: businesses.email,
      city: businesses.city,
    })
    .from(businesses)
    .where(eq(businesses.orgId, event.orgId))
    .limit(1)

  const contact: PortalContact = {
    businessName: business?.name ?? 'Event organiser',
    phone: business?.phone ?? null,
    email: business?.email ?? null,
    whatsapp: business?.phone ?? null,
    city: business?.city ?? null,
  }

  const enabled = await db
    .select({ key: businessServices.verticalKey, sortOrder: businessServices.sortOrder })
    .from(businessServices)
    .where(and(eq(businessServices.orgId, event.orgId), eq(businessServices.enabled, true)))
    .orderBy(asc(businessServices.sortOrder))

  const keys = enabled.map((s) => s.key)
  if (keys.length === 0) {
    return { token, orgId: event.orgId, event, contact, services: [], menu: [] }
  }

  const items = await db
    .select({
      id: serviceItems.id,
      verticalKey: serviceItems.verticalKey,
      name: serviceItems.name,
      description: serviceItems.description,
      category: serviceItems.category,
      unitClass: serviceItems.unitClass,
      unitLabel: serviceItems.unitLabel,
      pricePaise: serviceItems.pricePaise,
      dietary: serviceItems.dietary,
      imagePath: serviceItems.imagePath,
    })
    .from(serviceItems)
    .where(
      and(
        eq(serviceItems.orgId, event.orgId),
        eq(serviceItems.active, true),
        inArray(serviceItems.verticalKey, keys),
      ),
    )
    .orderBy(asc(serviceItems.verticalKey), asc(serviceItems.category), asc(serviceItems.sortOrder))
    .limit(600)

  const [sessions, areas] = await Promise.all([
    keys.includes('catering')
      ? db
          .select({
            name: eventCateringSessions.name,
            guestCount: eventCateringSessions.guestCount,
            startTime: eventCateringSessions.startTime,
            endTime: eventCateringSessions.endTime,
          })
          .from(eventCateringSessions)
          .where(
            and(
              eq(eventCateringSessions.orgId, event.orgId),
              eq(eventCateringSessions.eventId, event.id),
            ),
          )
          .orderBy(asc(eventCateringSessions.sortOrder))
      : Promise.resolve([]),
    keys.includes('decor')
      ? db
          .select({
            name: decorationAreas.name,
            dimensions: decorationAreas.dimensions,
          })
          .from(decorationAreas)
          .where(
            and(eq(decorationAreas.orgId, event.orgId), eq(decorationAreas.eventId, event.id)),
          )
          .orderBy(asc(decorationAreas.sortOrder))
      : Promise.resolve([]),
  ])

  const itemTranslations = locale
    ? await loadItemTranslations(
        db,
        event.orgId,
        locale,
        items.map((item) => item.id),
      )
    : new Map<string, { name: string; description: string | null }>()

  const services: PortalService[] = enabled.map((service) => {
    const descriptor = verticalDescriptor(service.key)
    const serviceItemsList = items.filter((item) => item.verticalKey === service.key)

    const byCategory = new Map<string, PortalItem[]>()
    for (const item of serviceItemsList) {
      const category = item.category?.trim() || descriptor.itemNoun
      const bucket = byCategory.get(category) ?? []
      const content = localiseContent(
        { name: item.name, description: item.description },
        itemTranslations.get(item.id),
      )
      bucket.push({
        id: item.id,
        name: content.name,
        description: content.description,
        category: item.category,
        unitClass: isUnitClass(item.unitClass) ? item.unitClass : 'FLAT',
        unitLabel: item.unitLabel,
        pricePaise: item.pricePaise,
        dietary: item.dietary,
        imagePath: item.imagePath,
      })
      byCategory.set(category, bucket)
    }

    const notes: { label: string; value: string }[] = []
    if (service.key === 'catering' && sessions.length > 0) {
      notes.push({
        label: 'Meal sessions',
        value: sessions
          .map(
            (s) =>
              `${s.name}${s.guestCount ? ` · ${s.guestCount} guests` : ''}${
                s.startTime ? ` · ${s.startTime}${s.endTime ? `–${s.endTime}` : ''}` : ''
              }`,
          )
          .join(' · '),
      })
    }
    if (service.key === 'decor' && areas.length > 0) {
      notes.push({
        label: 'Decoration areas',
        value: areas.map((a) => `${a.name}${a.dimensions ? ` (${a.dimensions})` : ''}`).join(' · '),
      })
    }

    return {
      key: service.key,
      label: descriptor.label,
      description: descriptor.configFields[0]?.hint ?? descriptor.label,
      categories: [...byCategory.entries()].map(([name, categoryItems]) => ({
        name,
        items: categoryItems,
      })),
      notes,
    }
  })

  const menu = keys.includes('catering')
    ? await loadEventMenu(event.orgId, event.id, locale)
    : []

  // A planned menu replaces the flat catering catalogue on the customer link:
  // the same dishes would otherwise appear twice, with two different rule sets.
  const visibleServices = menu.length > 0 ? services.filter((s) => s.key !== 'catering') : services

  return {
    token,
    orgId: event.orgId,
    event,
    contact,
    services: visibleServices.filter((s) => s.categories.length > 0),
    menu,
  }
}

/** Existing share link for an event, so the owner reuses rather than duplicates. */
export async function getShareLink(orgId: string, eventId: string) {
  if (!isDatabaseConfigured()) return null
  const db = getSystemDb()
  try {
    const [row] = await db
      .select({ token: shareLinks.token, expiresAt: shareLinks.expiresAt })
      .from(shareLinks)
      .where(
        and(eq(shareLinks.orgId, orgId), eq(shareLinks.eventId, eventId), eq(shareLinks.revoked, false)),
      )
      .orderBy(desc(shareLinks.createdAt))
      .limit(1)
    return row ?? null
  } catch {
    // Table not migrated yet: the event page must still render.
    return null
  }
}

/** The two link scopes the registry recognises. */
export const SHARE_LINK_KINDS = ['event', 'catalogue'] as const
