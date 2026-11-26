import type { MetadataRoute } from 'next'
import { and, eq, inArray } from 'drizzle-orm'
import { appUrl } from '@/lib/app-url'
import { isDemoEnvironment } from '@/lib/environment'
import { getSystemDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  businesses,
  businessServices,
  organisations,
  serviceItems,
  storefrontVersions,
  storefronts,
} from '@/lib/db/schema'
import { demoPublicProfile } from '@/lib/db/public'
import { parseStorefrontSnapshot } from '@/lib/domain/storefront-snapshot'
import { shownServiceKeys } from '@/lib/domain/storefront-sitemap'

export const revalidate = 3600

/**
 * One entry per page a crawler may index.
 *
 * The authority is the **published snapshot**, not the draft tables: a service the
 * owner hid before publishing, or a page they marked `noindex`, must not be
 * advertised here. Entitlement still comes from the live `business_services` row —
 * a service the workspace revoked is gone from the public route immediately, so
 * listing it would advertise a 404. This mirrors `getPublicProfile` exactly.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl()
  const now = new Date()

  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  if (isDemoEnvironment()) {
    return [
      ...statics,
      {
        url: `${base}/p/${demoPublicProfile().slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]
  }

  if (!isDatabaseConfigured()) return statics

  const db = getSystemDb()

  // A sitemap is not worth failing a deploy over: a paused database degrades to
  // the static routes and the next revalidation picks the rest up.
  let rows: { orgId: string; slug: string; snapshot: unknown }[] = []
  try {
    rows = await db
      .select({
        orgId: organisations.id,
        slug: organisations.slug,
        snapshot: storefrontVersions.snapshot,
      })
      .from(businesses)
      .innerJoin(organisations, eq(organisations.id, businesses.orgId))
      .innerJoin(storefronts, eq(storefronts.orgId, organisations.id))
      .innerJoin(storefrontVersions, eq(storefrontVersions.id, storefronts.publishedVersionId))
      .where(eq(businesses.published, true))
      .limit(5000)
  } catch (error) {
    console.warn('sitemap: storefront lookup skipped', error instanceof Error ? error.message : error)
    return statics
  }

  const pages = rows.flatMap((row) => {
    const snapshot = parseStorefrontSnapshot(row.snapshot)
    // An unreadable snapshot renders no public page, and `noindex` is an explicit
    // "do not list me" — neither belongs in a sitemap.
    if (!snapshot || snapshot.seo.noindex) return []
    return [{ orgId: row.orgId, slug: row.slug, snapshot }]
  })

  if (pages.length === 0) return statics

  const orgIds = pages.map((page) => page.orgId)

  // Which services the workspace still offers. Visibility is frozen in the
  // snapshot; entitlement is not, because it is a commercial fact that can change.
  let enabled: { orgId: string; verticalKey: string }[] = []
  let items: { orgId: string; itemId: string; verticalKey: string }[] = []
  try {
    ;[enabled, items] = await Promise.all([
      db
        .select({ orgId: businessServices.orgId, verticalKey: businessServices.verticalKey })
        .from(businessServices)
        .where(and(inArray(businessServices.orgId, orgIds), eq(businessServices.enabled, true))),
      db
        .select({
          orgId: serviceItems.orgId,
          itemId: serviceItems.id,
          verticalKey: serviceItems.verticalKey,
        })
        .from(serviceItems)
        .where(and(inArray(serviceItems.orgId, orgIds), eq(serviceItems.active, true)))
        .limit(5000),
    ])
  } catch (error) {
    console.warn('sitemap: catalogue lookup skipped', error instanceof Error ? error.message : error)
  }

  const enabledByOrg = new Map<string, Set<string>>()
  for (const service of enabled) {
    const set = enabledByOrg.get(service.orgId) ?? new Set<string>()
    set.add(service.verticalKey)
    enabledByOrg.set(service.orgId, set)
  }

  /** The service keys this published version actually shows. */
  const shownByOrg = new Map<string, Set<string>>()
  for (const page of pages) {
    const entitled = enabledByOrg.get(page.orgId) ?? new Set<string>()
    shownByOrg.set(page.orgId, new Set(shownServiceKeys(page.snapshot.services, entitled)))
  }

  const slugByOrg = new Map(pages.map((page) => [page.orgId, page.slug]))

  const storefrontUrls: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${base}/p/${page.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const serviceUrls: MetadataRoute.Sitemap = pages.flatMap((page) =>
    [...(shownByOrg.get(page.orgId) ?? [])].map((verticalKey) => ({
      url: `${base}/p/${page.slug}/services/${verticalKey}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  )

  const itemUrls: MetadataRoute.Sitemap = items.flatMap((item) => {
    const slug = slugByOrg.get(item.orgId)
    // An item is only reachable when its own service is shown by this version.
    if (!slug || !shownByOrg.get(item.orgId)?.has(item.verticalKey)) return []
    return [
      {
        url: `${base}/p/${slug}/services/${item.itemId}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      },
    ]
  })

  return [...statics, ...storefrontUrls, ...serviceUrls, ...itemUrls]
}
