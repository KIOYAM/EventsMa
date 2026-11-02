import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { businessServices, businesses, organisations, serviceItems } from './schema'
import { demoBusiness, demoItems, demoServices } from '@/lib/demo/data'
import { verticalDescriptor } from '@/lib/domain/verticals'

export interface PublicProfile {
  orgId: string
  slug: string
  name: string
  tagline: string | null
  city: string | null
  phone: string | null
  services: { verticalKey: string; label: string; itemCount: number }[]
}

export function demoPublicProfile(): PublicProfile {
  return {
    orgId: demoBusiness.orgId,
    slug: 'annapoorna-events',
    name: demoBusiness.name,
    tagline: demoBusiness.tagline,
    city: demoBusiness.city,
    phone: demoBusiness.phone,
    services: demoServices.map((s) => ({
      verticalKey: s.verticalKey,
      label: verticalDescriptor(s.verticalKey).label,
      itemCount: demoItems.filter((i) => i.verticalKey === s.verticalKey).length,
    })),
  }
}

export async function getPublicProfile(slug: string): Promise<PublicProfile | null> {
  if (!isDatabaseConfigured()) return demoPublicProfile()

  const db = getDb()
  const [row] = await db
    .select({
      orgId: organisations.id,
      slug: organisations.slug,
      name: businesses.name,
      tagline: businesses.tagline,
      city: businesses.city,
      phone: businesses.phone,
      published: businesses.published,
    })
    .from(organisations)
    .innerJoin(businesses, eq(businesses.orgId, organisations.id))
    .where(and(eq(organisations.slug, slug), eq(businesses.published, true)))
    .limit(1)

  if (!row) return null

  const [services, counts] = await Promise.all([
    db
      .select({ verticalKey: businessServices.verticalKey })
      .from(businessServices)
      .where(and(eq(businessServices.orgId, row.orgId), eq(businessServices.enabled, true)))
      .orderBy(businessServices.sortOrder),
    db
      .select({ verticalKey: serviceItems.verticalKey, count: sql<number>`count(*)::int` })
      .from(serviceItems)
      .where(and(eq(serviceItems.orgId, row.orgId), eq(serviceItems.active, true)))
      .groupBy(serviceItems.verticalKey),
  ])

  const countMap = new Map(counts.map((c) => [c.verticalKey, c.count]))

  return {
    orgId: row.orgId,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    city: row.city,
    phone: row.phone,
    services: services.map((s) => ({
      verticalKey: s.verticalKey,
      label: verticalDescriptor(s.verticalKey).label,
      itemCount: countMap.get(s.verticalKey) ?? 0,
    })),
  }
}
