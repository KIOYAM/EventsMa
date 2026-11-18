import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { getSystemDb } from './client'
import {
  businesses,
  organisations,
  storefrontSections,
  storefrontVersions,
  storefronts,
} from './schema'
import { getPublicProfile } from './public'
import {
  getPublishState,
  getPublishedSnapshot,
  listStorefrontVersions,
  publishStorefront,
  restoreStorefrontVersion,
} from './storefronts'

/**
 * The publish invariant: **a saved edit must never reach a visitor.**
 *
 * This is the test that makes the whole Phase 1 design worth having. Without it
 * "publishing" is just a button: the draft and the live page are the same rows,
 * so any write is instantly public. Here two tenants are seeded, A publishes v1,
 * A's draft is then rewritten, and the public read path is asserted to still
 * serve v1 — byte for byte, on identity, brand colour, introduction text and a
 * section heading.
 *
 * Live database only: the resolvers are `server-only` Postgres functions and a
 * fake would test the fake. Both tenants are removed in `afterAll`; every child
 * row cascades from the organisation.
 *
 *   TENANCY_LIVE_TEST=1 npx vitest run lib/db/storefront-publishing.integration.test.ts
 */
const LIVE = process.env.TENANCY_LIVE_TEST === '1'

describe.skipIf(!LIVE)('storefront publishing', () => {
  const suffix = randomUUID().slice(0, 8)
  const orgA = randomUUID()
  const orgB = randomUUID()
  const orgC = randomUUID()
  const orgD = randomUUID()
  const slugA = `publish-a-${suffix}`
  const slugB = `publish-b-${suffix}`
  const slugC = `publish-c-${suffix}`
  const slugD = `publish-d-${suffix}`

  const aboutV1 = `Published introduction ${suffix}`
  const headingV1 = `Published heading ${suffix}`
  const aboutDraft = `Draft introduction ${suffix}`
  const headingDraft = `Draft heading ${suffix}`

  async function seedOrg(orgId: string, slug: string, name: string) {
    const db = getSystemDb()
    await db.insert(organisations).values({
      id: orgId,
      name,
      slug,
      plan: 'trial',
      status: 'active',
    })
    await db.insert(businesses).values({
      orgId,
      name,
      published: false,
      tagline: `Tagline ${slug}`,
      city: 'Kochi',
      settings: {
        brand: { primary: '#8a6524', theme: 'editorial', font: 'sans', subtitle: 'Catering · Decor' },
        about: aboutV1,
      },
    })
    await db.insert(storefrontSections).values([
      { orgId, key: 'hero', position: 0, visible: true, heading: headingV1 },
      { orgId, key: 'services', position: 1, visible: true },
    ])
  }

  async function seedWithSnapshot(
    orgId: string,
    slug: string,
    name: string,
    draftAbout: string,
    draftHeading: string,
    schemaVersion: number,
    snapshot: Record<string, unknown>,
  ) {
    const db = getSystemDb()
    await db.insert(organisations).values({
      id: orgId,
      name,
      slug,
      plan: 'trial',
      status: 'active',
    })
    await db.insert(businesses).values({
      orgId,
      name,
      published: true,
      tagline: `Tagline ${slug}`,
      city: 'Kochi',
      settings: {
        brand: { primary: '#8a6524', theme: 'editorial', font: 'serif' },
        about: draftAbout,
      },
    })
    await db.insert(storefrontSections).values([
      { orgId, key: 'hero', position: 0, visible: true, heading: draftHeading },
      { orgId, key: 'services', position: 1, visible: true },
    ])

    // storefronts and storefront_versions point at each other, so the pointer is
    // written after the version exists.
    const storefrontId = randomUUID()
    const versionId = randomUUID()
    await db.insert(storefronts).values({ id: storefrontId, orgId, status: 'published' })
    await db.insert(storefrontVersions).values({
      id: versionId,
      orgId,
      storefrontId,
      version: 1,
      schemaVersion,
      snapshot,
    })
    await db
      .update(storefronts)
      .set({ publishedVersionId: versionId, publishedAt: new Date() })
      .where(eq(storefronts.id, storefrontId))
  }

  beforeAll(async () => {
    process.loadEnvFile('.env.local')
    await seedOrg(orgA, slugA, `Publish A ${suffix}`)
    await seedOrg(orgB, slugB, `Publish B ${suffix}`)
  })

  afterAll(async () => {
    const db = getSystemDb()
    await db.delete(organisations).where(sql`id in (${orgA}, ${orgB}, ${orgC}, ${orgD})`)
  })

  it('publishes a version and serves it to the public', async () => {
    const result = await publishStorefront(orgA, null, getSystemDb())
    expect(result).toMatchObject({ ok: true, version: 1 })

    const snapshot = await getPublishedSnapshot(orgA)
    expect(snapshot?.identity.name).toBe(`Publish A ${suffix}`)
    expect(snapshot?.brand.primary).toBe('#8a6524')
    expect(snapshot?.brand.about).toBe(aboutV1)
    expect(snapshot?.brand.theme).toBe('editorial')
    expect(snapshot?.brand.font).toBe('sans')

    const page = await getPublicProfile(slugA)
    expect(page?.name).toBe(`Publish A ${suffix}`)
    expect(page?.brandPrimary).toBe('#8a6524')
    expect(page?.about).toBe(aboutV1)
    expect(page?.sections.find((section) => section.key === 'hero')?.heading).toBe(headingV1)
  })

  it('does not leak a saved draft edit to the public page', async () => {
    const db = getSystemDb()

    // The owner keeps editing after publishing.
    await db
      .update(businesses)
      .set({
        name: `Draft name ${suffix}`,
        tagline: `Draft tagline ${suffix}`,
        settings: sql`jsonb_set(
          jsonb_set(coalesce(${businesses.settings}, '{}'::jsonb), '{brand,primary}', '"#c56e4e"'::jsonb),
          '{about}', ${JSON.stringify(aboutDraft)}::jsonb
        )`,
      })
      .where(sql`${businesses.orgId} = ${orgA}`)
    await db
      .update(storefrontSections)
      .set({ heading: headingDraft })
      .where(sql`${storefrontSections.orgId} = ${orgA} and ${storefrontSections.key} = 'hero'`)

    const draftState = await getPublishState(orgA, false, getSystemDb())
    expect(draftState.hasUnpublishedChanges).toBe(true)
    expect(draftState.publishedVersion).toBe(1)

    // The invariant: the public page is unchanged.
    const snapshot = await getPublishedSnapshot(orgA)
    expect(snapshot?.identity.name).toBe(`Publish A ${suffix}`)
    expect(snapshot?.brand.primary).toBe('#8a6524')
    expect(snapshot?.brand.about).toBe(aboutV1)

    const page = await getPublicProfile(slugA)
    expect(page?.name).toBe(`Publish A ${suffix}`)
    expect(page?.tagline).toBe(`Tagline ${slugA}`)
    expect(page?.brandPrimary).toBe('#8a6524')
    expect(page?.about).toBe(aboutV1)
    expect(page?.sections.find((section) => section.key === 'hero')?.heading).toBe(headingV1)
  })

  it('publishes the edits as version 2, and only then makes them public', async () => {
    const result = await publishStorefront(orgA, null, getSystemDb())
    expect(result).toMatchObject({ ok: true, version: 2 })

    const state = await getPublishState(orgA, false, getSystemDb())
    expect(state.hasUnpublishedChanges).toBe(false)
    expect(state.status).toBe('published')

    const page = await getPublicProfile(slugA)
    expect(page?.name).toBe(`Draft name ${suffix}`)
    expect(page?.brandPrimary).toBe('#c56e4e')
    expect(page?.about).toBe(aboutDraft)
    expect(page?.sections.find((section) => section.key === 'hero')?.heading).toBe(headingDraft)
  })

  it('rolls back by publishing a new version, never rewriting history', async () => {
    const versions = await listStorefrontVersions(orgA, 10, getSystemDb())
    const first = versions.find((version) => version.version === 1)
    expect(first).toBeDefined()

    const restored = await restoreStorefrontVersion(orgA, first!.id, null, getSystemDb())
    expect(restored).toMatchObject({ ok: true, version: 3 })

    // v1's own row is untouched; v3 is the new live version.
    const after = await listStorefrontVersions(orgA, 10, getSystemDb())
    expect(after.map((version) => version.version)).toEqual([3, 2, 1])
    expect(after.find((version) => version.isLive)?.version).toBe(3)

    const page = await getPublicProfile(slugA)
    expect(page?.name).toBe(`Publish A ${suffix}`)
    expect(page?.brandPrimary).toBe('#8a6524')
    expect(page?.about).toBe(aboutV1)
    expect(page?.sections.find((section) => section.key === 'hero')?.heading).toBe(headingV1)
  })

  it('keeps tenants apart', async () => {
    // B never published, so it has no snapshot even though its draft exists.
    expect(await getPublishedSnapshot(orgB)).toBeNull()

    const resultB = await publishStorefront(orgB, null, getSystemDb())
    expect(resultB).toMatchObject({ ok: true, version: 1 })

    const versionsA = await listStorefrontVersions(orgA, 10, getSystemDb())
    const versionsB = await listStorefrontVersions(orgB, 10, getSystemDb())
    expect(versionsA).toHaveLength(3)
    expect(versionsB).toHaveLength(1)
    const foreign = versionsA[0]!
    expect(foreign.version).toBe(3)

    const snapshotA = await getPublishedSnapshot(orgA)
    const snapshotB = await getPublishedSnapshot(orgB)
    expect(snapshotA?.identity.name).toBe(`Publish A ${suffix}`)
    expect(snapshotB?.identity.name).toBe(`Publish B ${suffix}`)

    // A version id from tenant A cannot be restored into tenant B: the lookup is
    // scoped by org, so it reports "not found" and B's draft is untouched.
    const refused = await restoreStorefrontVersion(orgB, foreign.id, null, getSystemDb())
    expect(refused).toEqual({ ok: false, error: 'version' })

    const afterB = await getPublishedSnapshot(orgB)
    expect(afterB?.identity.name).toBe(`Publish B ${suffix}`)
    expect(await listStorefrontVersions(orgB, 10, getSystemDb())).toHaveLength(1)
  })

  it('serves a v2 snapshot instead of the draft it was published from', async () => {
    const draftAbout = `v2 draft introduction ${suffix}`
    const draftHeading = `v2 draft heading ${suffix}`
    const liveAbout = `v2 snapshot introduction ${suffix}`
    const liveHeading = `v2 snapshot heading ${suffix}`

    await seedWithSnapshot(orgC, slugC, `Publish C ${suffix}`, draftAbout, draftHeading, 2, {
      schemaVersion: 2,
      identity: {
        name: `Publish C ${suffix}`,
        tagline: `Tagline ${slugC}`,
        city: 'Kochi',
        phone: null,
      },
      brand: {
        theme: 'editorial',
        font: 'serif',
        primary: '#123456',
        subtitle: null,
        about: liveAbout,
        logoPath: null,
      },
      sections: [
        {
          key: 'hero',
          position: 0,
          visible: true,
          heading: liveHeading,
          imagePath: null,
          config: { faq: [], team: [] },
        },
        {
          key: 'services',
          position: 1,
          visible: true,
          heading: null,
          imagePath: null,
          config: { faq: [], team: [] },
        },
      ],
      publishedAt: new Date().toISOString(),
    })

    const page = await getPublicProfile(slugC)
    expect(page?.about).toBe(liveAbout)
    expect(page?.brandPrimary).toBe('#123456')
    expect(page?.sections.find((section) => section.key === 'hero')?.heading).toBe(liveHeading)
    expect(page?.about).not.toBe(draftAbout)
    expect(page?.sections.find((section) => section.key === 'hero')?.heading).not.toBe(draftHeading)
  })

  it('does not serve the draft when the published version is unreadable', async () => {
    await seedWithSnapshot(
      orgD,
      slugD,
      `Publish D ${suffix}`,
      `unreadable draft introduction ${suffix}`,
      `unreadable draft heading ${suffix}`,
      99,
      {
        schemaVersion: 99,
        identity: { name: `Publish D ${suffix}` },
        brand: {},
        sections: [],
      },
    )

    expect(await getPublicProfile(slugD)).toBeNull()
  })
})
