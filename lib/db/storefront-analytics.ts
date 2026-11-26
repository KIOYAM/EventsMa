import 'server-only'
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { getDb, getSystemDb, isDatabaseConfigured } from './client'
import { businesses, enquiries, organisations, storefrontViews } from './schema'
import {
  attributionBucket,
  type StorefrontAttribution,
} from '@/lib/domain/storefront-attribution'
import { SECTION_KEYS, type SectionKey } from '@/lib/domain/storefront'

/**
 * Storefront readership and enquiry sources.
 *
 * Reads go through `getDb()`, so RLS scopes them to the caller's organisation.
 * The public beacon has no session and writes through `getSystemDb()` after
 * resolving the slug — the same deliberate split the enquiry action uses.
 */
export interface StorefrontAnalytics {
  views: number
  enquiries: number
  /** Enquiries in the window, grouped by the section they acted in. */
  sections: { section: SectionKey; count: number }[]
}

const EMPTY: StorefrontAnalytics = { views: 0, enquiries: 0, sections: [] }

/** Seven calendar days, today included. The window the overview card states. */
const WINDOW_DAYS = 7

export async function getStorefrontAnalytics(
  orgId: string,
  demo: boolean,
): Promise<StorefrontAnalytics> {
  if (demo || !isDatabaseConfigured()) return EMPTY

  const db = getDb()
  const [viewRow, enquiryRow, sectionRows] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${storefrontViews.views}), 0)::int` })
      .from(storefrontViews)
      .where(
        and(
          eq(storefrontViews.orgId, orgId),
          // Cast the parameter: `date - unknown` is ambiguous between integer and
          // interval, and Postgres refuses to guess.
          gte(storefrontViews.day, sql`current_date - cast(${WINDOW_DAYS - 1} as integer)`),
        ),
      ),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(enquiries)
      .where(
        and(
          eq(enquiries.orgId, orgId),
          eq(enquiries.source, 'storefront'),
          gte(enquiries.createdAt, sql`now() - interval '7 days'`),
        ),
      ),
    db
      .select({
        section: enquiries.landingSection,
        total: sql<number>`count(*)::int`,
      })
      .from(enquiries)
      .where(
        and(
          eq(enquiries.orgId, orgId),
          eq(enquiries.source, 'storefront'),
          gte(enquiries.createdAt, sql`now() - interval '7 days'`),
          inArray(enquiries.landingSection, [...SECTION_KEYS]),
        ),
      )
      .groupBy(enquiries.landingSection)
      .orderBy(desc(sql`count(*)`))
      .limit(4),
  ])

  return {
    views: Number(viewRow?.[0]?.total ?? 0),
    enquiries: Number(enquiryRow?.[0]?.total ?? 0),
    sections: sectionRows.flatMap((row) =>
      row.section
        ? [{ section: row.section as SectionKey, count: Number(row.total) }]
        : [],
    ),
  }
}

/**
 * Count one public page view.
 *
 * The slug is resolved against a *published* business, so a draft or a typo
 * writes nothing. Errors propagate to the route, which swallows them: a counter
 * must never turn a reader's page into an error.
 */
export async function recordStorefrontView(input: {
  slug: string
  attribution: StorefrontAttribution
}): Promise<void> {
  if (!isDatabaseConfigured()) return
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(input.slug)) return

  const db = getSystemDb()
  const [org] = await db
    .select({ id: organisations.id, slug: organisations.slug })
    .from(organisations)
    .innerJoin(businesses, eq(businesses.orgId, organisations.id))
    .where(and(eq(organisations.slug, input.slug), eq(businesses.published, true)))
    .limit(1)

  if (!org) return

  const path = `/p/${org.slug}`
  const bucket = attributionBucket(path, input.attribution)

  await db.execute(sql`
    insert into public.storefront_views
      (org_id, day, bucket, path, referrer_host, utm_source, utm_medium, utm_campaign)
    values
      (${org.id}, current_date, ${bucket}, ${path}, ${input.attribution.referrerHost},
       ${input.attribution.utmSource}, ${input.attribution.utmMedium},
       ${input.attribution.utmCampaign})
    on conflict (org_id, day, bucket) do update
      set views = public.storefront_views.views + 1,
          updated_at = now()
  `)
}
