import type { MetadataRoute } from 'next'
import { eq } from 'drizzle-orm'
import { appUrl } from '@/lib/app-url'
import { isDemoEnvironment } from '@/lib/environment'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { businesses, organisations } from '@/lib/db/schema'
import { demoPublicProfile } from '@/lib/db/public'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl()
  const now = new Date()

  if (isDemoEnvironment()) {
    return [
      { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
      {
        url: `${base}/privacy`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${base}/terms`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${base}/p/${demoPublicProfile().slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]
  }

  if (!isDatabaseConfigured()) return []

  const rows = await getDb()
    .select({ slug: organisations.slug })
    .from(businesses)
    .innerJoin(organisations, eq(businesses.orgId, organisations.id))
    .where(eq(businesses.published, true))
    .limit(5000)

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...rows.map((row) => ({
      url: `${base}/p/${row.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
