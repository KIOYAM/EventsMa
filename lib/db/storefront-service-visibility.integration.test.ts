import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { getSystemDb } from './client'
import { businesses, businessServices, organisations } from './schema'
import { getPublicProfile } from './public'
import { publishStorefront } from './storefronts'

/**
 * Entitlement and storefront visibility are different decisions.
 *
 * `business_services.enabled` is what the workspace offers (and what a visitor may
 * be shown at all); `storefront_visible` is the owner's choice, frozen into a
 * published version. One linear sequence pins all three rules, so the test does
 * not depend on another test having run first:
 *
 * 1. a hidden activated service is not shown,
 * 2. toggling it changes nothing until a publish,
 * 3. publishing shows it, and
 * 4. losing the entitlement hides it immediately.
 */
const LIVE = process.env.TENANCY_LIVE_TEST === '1'
const suffix = randomUUID().slice(0, 6)
const orgId = randomUUID()
const slug = `verify-services-${suffix}`

function keys(page: Awaited<ReturnType<typeof getPublicProfile>>): string[] {
  return page?.services.map((service) => service.verticalKey) ?? []
}

describe.skipIf(!LIVE)('storefront service visibility', () => {
  beforeAll(async () => {
    process.loadEnvFile('.env.local')

    const db = getSystemDb()
    await db.insert(organisations).values({
      id: orgId,
      name: `Services ${suffix}`,
      slug,
      plan: 'trial',
      status: 'active',
    })
    await db.insert(businesses).values({
      orgId,
      name: `Services ${suffix}`,
      published: false,
      city: 'Kochi',
      settings: { brand: { primary: '#183d33', theme: 'editorial', font: 'serif' } },
    })
    await db.insert(businessServices).values([
      { orgId, verticalKey: 'catering', enabled: true, storefrontVisible: true, sortOrder: 0 },
      { orgId, verticalKey: 'decor', enabled: true, storefrontVisible: false, sortOrder: 1 },
      // Never activated: must not be rendered whatever the visibility flag says.
      { orgId, verticalKey: 'hospitality', enabled: false, storefrontVisible: true, sortOrder: 2 },
    ])
  })

  afterAll(async () => {
    if (!LIVE) return
    await getSystemDb().delete(organisations).where(eq(organisations.id, orgId))
  })

  it('separates the entitlement from what the public page shows', async () => {
    const db = getSystemDb()

    // 1. Publish with decor hidden: only the shown, activated service appears.
    expect(await publishStorefront(orgId, null, db)).toMatchObject({ ok: true, version: 1 })
    expect(keys(await getPublicProfile(slug))).toEqual(['catering'])

    // 2. The owner turns decor on. The live page must not change yet.
    await db
      .update(businessServices)
      .set({ storefrontVisible: true })
      .where(and(eq(businessServices.orgId, orgId), eq(businessServices.verticalKey, 'decor')))
    expect(keys(await getPublicProfile(slug))).toEqual(['catering'])

    // 3. Publishing makes it public, in the owner's order.
    expect(await publishStorefront(orgId, null, db)).toMatchObject({ ok: true, version: 2 })
    expect(keys(await getPublicProfile(slug))).toEqual(['catering', 'decor'])

    // 4. A service the workspace stops offering leaves the page at once, even
    //    though the published version still lists it as visible.
    await db
      .update(businessServices)
      .set({ enabled: false })
      .where(and(eq(businessServices.orgId, orgId), eq(businessServices.verticalKey, 'catering')))
    expect(keys(await getPublicProfile(slug))).toEqual(['decor'])
  })
})
