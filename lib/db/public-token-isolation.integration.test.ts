import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getSystemDb } from './client'
import {
  businesses,
  businessServices,
  events,
  invitations,
  organisations,
  portfolioItems,
  quotationLines,
  quotationVersions,
  quotations,
  serviceItems,
} from './schema'
import { shareLinks } from './schema-share'
import { getSharePortal } from './share-portal'
import { getPublicProfile } from './public'
import { publishStorefront } from './storefronts'
import { getPublicQuoteDocument } from './queries'

/**
 * G1: the four public token paths must never cross a tenant boundary.
 *
 * None of these routes has a member session — the token *is* the authorisation —
 * so the risk is not a missing policy but a resolver that trusts the token to
 * name the tenant while joining something else. Each test seeds two tenants and
 * asserts that tenant A's link returns A's rows and cannot reach B's.
 *
 * Live database only, because the resolvers are `server-only` query functions
 * against Postgres and a fake would test the fake. Two temporary tenants are
 * committed, then removed in `afterAll` (every child row cascades from the org):
 *
 *   TENANCY_LIVE_TEST=1 npx vitest run lib/db/public-token-isolation.integration.test.ts
 */
const LIVE = process.env.TENANCY_LIVE_TEST === '1'

describe.skipIf(!LIVE)('public token isolation', () => {
  const suffix = randomUUID().slice(0, 8)
  const orgA = randomUUID()
  const orgB = randomUUID()

  const slugA = `token-a-${suffix}`
  const slugB = `token-b-${suffix}`
  const eventA = randomUUID()
  const eventB = randomUUID()
  const quoteA = randomUUID()
  const quoteB = randomUUID()
  const versionA = randomUUID()
  const versionB = randomUUID()

  const shareTokenA = `share-a-${suffix}`
  const shareTokenB = `share-b-${suffix}`
  /** Deliberately misconfigured: tenant A's link aimed at tenant B's event. */
  const crossedShareToken = `share-cross-${suffix}`
  const quoteTokenA = `quote-a-${suffix}`
  const quoteTokenB = `quote-b-${suffix}`
  const inviteTokenA = `invite-a-${suffix}`
  const inviteTokenB = `invite-b-${suffix}`

  const dishA = `A-only dish ${suffix}`
  const dishB = `B-only dish ${suffix}`
  /** Tenant A owns this row but never adopted the decor vertical. */
  const unadoptedDecorA = `A decor ${suffix}`
  const workA = `A portfolio ${suffix}`
  const workB = `B portfolio ${suffix}`

  beforeAll(async () => {
    try {
      process.loadEnvFile('.env.local')
    } catch {
      // The command may already have the environment exported.
    }
    // `getPublicProfile` refuses to serve real data in demo mode, which is what a
    // missing Supabase pair means outside production. Storage stays unconfigured,
    // so every seeded portfolio row uses a null cover path.
    process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://token-isolation.test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

    const db = getSystemDb()
    await db.insert(organisations).values([
      { id: orgA, name: `Token A ${suffix}`, slug: slugA, plan: 'trial', status: 'active' },
      { id: orgB, name: `Token B ${suffix}`, slug: slugB, plan: 'trial', status: 'active' },
    ])

    await db.insert(businesses).values([
      { orgId: orgA, name: `A Events ${suffix}`, published: false },
      { orgId: orgB, name: `B Events ${suffix}`, published: false },
    ])

    // A public page is served only from a published version, so both tenants get
    // one here; the isolation assertions below are about whose data is returned,
    // not about which publish path created it.
    expect(await publishStorefront(orgA, null, db)).toMatchObject({ ok: true })
    expect(await publishStorefront(orgB, null, db)).toMatchObject({ ok: true })

    await db.insert(businessServices).values([
      { orgId: orgA, verticalKey: 'catering', enabled: true, sortOrder: 0 },
      { orgId: orgB, verticalKey: 'catering', enabled: true, sortOrder: 0 },
    ])

    await db.insert(serviceItems).values([
      { orgId: orgA, verticalKey: 'catering', name: dishA, unitClass: 'PER_GUEST', pricePaise: 45_000 },
      { orgId: orgB, verticalKey: 'catering', name: dishB, unitClass: 'PER_GUEST', pricePaise: 52_000 },
      { orgId: orgA, verticalKey: 'decor', name: unadoptedDecorA, unitClass: 'FLAT', pricePaise: 450_000 },
    ])

    await db.insert(events).values([
      { id: eventA, orgId: orgA, title: `A event ${suffix}`, eventDate: '2027-02-11', guests: 120 },
      { id: eventB, orgId: orgB, title: `B event ${suffix}`, eventDate: '2027-03-19', guests: 80 },
    ])

    await db.insert(shareLinks).values([
      { orgId: orgA, eventId: eventA, token: shareTokenA, kind: 'event' },
      { orgId: orgB, eventId: eventB, token: shareTokenB, kind: 'event' },
      { orgId: orgA, eventId: eventB, token: crossedShareToken, kind: 'event' },
    ])

    await db.insert(quotations).values([
      {
        id: quoteA,
        orgId: orgA,
        eventId: eventA,
        number: `QT-A-${suffix}`,
        status: 'sent',
        publicToken: quoteTokenA,
      },
      {
        id: quoteB,
        orgId: orgB,
        eventId: eventB,
        number: `QT-B-${suffix}`,
        status: 'sent',
        publicToken: quoteTokenB,
      },
    ])

    await db.insert(quotationVersions).values([
      {
        id: versionA,
        orgId: orgA,
        quotationId: quoteA,
        version: 1,
        subtotalPaise: 450_000,
        totalPaise: 531_000,
        guests: 120,
        sentAt: new Date(),
      },
      {
        id: versionB,
        orgId: orgB,
        quotationId: quoteB,
        version: 1,
        subtotalPaise: 520_000,
        totalPaise: 613_600,
        guests: 80,
        sentAt: new Date(),
      },
    ])

    await db
      .update(quotations)
      .set({ currentVersionId: versionA })
      .where(eq(quotations.id, quoteA))
    await db
      .update(quotations)
      .set({ currentVersionId: versionB })
      .where(eq(quotations.id, quoteB))

    await db.insert(quotationLines).values([
      {
        orgId: orgA,
        versionId: versionA,
        serviceKey: 'catering',
        label: `A line ${suffix}`,
        unitClass: 'PER_GUEST',
        basis: 120,
        unitRatePaise: 3_750,
        grossPaise: 450_000,
        taxablePaise: 450_000,
        taxPaise: 81_000,
        totalPaise: 531_000,
      },
      {
        orgId: orgB,
        versionId: versionB,
        serviceKey: 'catering',
        label: `B line ${suffix}`,
        unitClass: 'PER_GUEST',
        basis: 80,
        unitRatePaise: 6_500,
        grossPaise: 520_000,
        taxablePaise: 520_000,
        taxPaise: 93_600,
        totalPaise: 613_600,
      },
    ])

    await db.insert(portfolioItems).values([
      { orgId: orgA, title: workA, published: true, coverPath: null },
      { orgId: orgB, title: workB, published: true, coverPath: null },
    ])

    await db.insert(invitations).values([
      {
        orgId: orgA,
        email: `a-${suffix}@token.test`,
        role: 'manager',
        token: inviteTokenA,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
      {
        orgId: orgB,
        email: `b-${suffix}@token.test`,
        role: 'manager',
        token: inviteTokenB,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    ])
  })

  afterAll(async () => {
    if (!LIVE) return
    const db = getSystemDb()
    await db.delete(organisations).where(eq(organisations.id, orgA))
    await db.delete(organisations).where(eq(organisations.id, orgB))
  })

  it('share: a token returns its own tenant event and catalogue only', async () => {
    const portalA = await getSharePortal(shareTokenA)
    expect(portalA?.orgId).toBe(orgA)
    expect(portalA?.event?.id).toBe(eventA)
    expect(portalA?.contact.businessName).toBe(`A Events ${suffix}`)

    const namesA = (portalA?.services ?? []).flatMap((service) =>
      service.categories.flatMap((category) => category.items.map((item) => item.name)),
    )
    expect(namesA).toContain(dishA)
    expect(namesA).not.toContain(dishB)

    const portalB = await getSharePortal(shareTokenB)
    expect(portalB?.orgId).toBe(orgB)
    expect(portalB?.event?.id).toBe(eventB)
    const namesB = (portalB?.services ?? []).flatMap((service) =>
      service.categories.flatMap((category) => category.items.map((item) => item.name)),
    )
    expect(namesB).toContain(dishB)
    expect(namesB).not.toContain(dishA)
  })

  it('share: a link pointing at another tenant event resolves to nothing', async () => {
    expect(await getSharePortal(crossedShareToken)).toBeNull()
  })

  it('share: an unknown token resolves to nothing', async () => {
    expect(await getSharePortal(`nobody-${suffix}`)).toBeNull()
  })

  it('quote: a token resolves to the tenant that issued it', async () => {
    const db = getSystemDb()
    const [rowA] = await db
      .select({ orgId: quotations.orgId, id: quotations.id })
      .from(quotations)
      .where(eq(quotations.publicToken, quoteTokenA))
      .limit(1)

    expect(rowA?.orgId).toBe(orgA)
    expect(rowA?.id).toBe(quoteA)
  })

  it('quote: the document is only built for the owning tenant', async () => {
    const own = await getPublicQuoteDocument(orgA, quoteA)
    expect(own?.number).toBe(`QT-A-${suffix}`)
    const labels = (own?.serviceGroups ?? []).flatMap((group) =>
      group.lines.map((line) => line.label),
    )
    expect(labels).toContain(`A line ${suffix}`)
    expect(labels).not.toContain(`B line ${suffix}`)

    // Tenant B asking for tenant A's quotation gets nothing, and vice versa.
    expect(await getPublicQuoteDocument(orgB, quoteA)).toBeNull()
    expect(await getPublicQuoteDocument(orgA, quoteB)).toBeNull()
  })

  it('storefront: a slug returns its own tenant profile only', async () => {
    const profileA = await getPublicProfile(slugA)
    expect(profileA?.orgId).toBe(orgA)
    expect(profileA?.name).toBe(`A Events ${suffix}`)
    expect(profileA?.portfolio.map((item) => item.title)).toEqual([workA])

    const profileB = await getPublicProfile(slugB)
    expect(profileB?.orgId).toBe(orgB)
    expect(profileB?.portfolio.map((item) => item.title)).toEqual([workB])
  })

  it('storefront: only adopted services and their catalogue are shown', async () => {
    const profileA = await getPublicProfile(slugA)
    // A adopted catering only, so its decor item must not appear anywhere; the
    // vertical is never enabled, so its rows are not even loaded.
    expect(profileA?.services.map((service) => service.verticalKey)).toEqual(['catering'])
    const catering = profileA?.services[0]
    expect(catering?.itemNoun).toBe('dish')
    expect(catering?.itemCount).toBe(1)
    expect(catering?.items.map((item) => item.name)).toEqual([dishA])
    expect(catering?.items.some((item) => item.name === unadoptedDecorA)).toBe(false)
    expect(catering?.items.some((item) => item.name === dishB)).toBe(false)
  })

  it('storefront: an unknown slug resolves to nothing', async () => {
    expect(await getPublicProfile(`no-such-store-${suffix}`)).toBeNull()
  })

  it('invite: a token belongs to exactly one tenant', async () => {
    const db = getSystemDb()
    const rows = await db
      .select({ orgId: invitations.orgId, email: invitations.email })
      .from(invitations)
      .where(eq(invitations.token, inviteTokenA))

    // Acceptance inserts a membership with this row's org_id and nothing else from
    // the request, so a token that maps to one org cannot add the invitee to another.
    expect(rows).toHaveLength(1)
    expect(rows[0]?.orgId).toBe(orgA)
    expect(rows[0]?.email).toBe(`a-${suffix}@token.test`)
  })
})
