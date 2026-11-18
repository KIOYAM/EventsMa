import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, eq, sql } from 'drizzle-orm'
import { getSystemDb } from './client'
import {
  businesses,
  organisations,
  storefrontSections,
  storefrontVersions,
} from './schema'
import { getPublicProfile } from './public'
import { publishStorefront } from './storefronts'

/**
 * Two promises this file keeps honest.
 *
 * 1. A workspace whose flag says "published" but which has no published version
 *    is not served at all. Before 0013 the public page quietly rendered its draft,
 *    which is how a settings toggle could put unpublished edits on the internet.
 * 2. Content written in the new sections (FAQ answers, team names) is draft
 *    content like any other: it reaches the public page only through a publish.
 */
const LIVE = process.env.TENANCY_LIVE_TEST === '1'
const suffix = randomUUID().slice(0, 6)
const created: string[] = []

async function seed(published: boolean): Promise<{ orgId: string; slug: string }> {
  const db = getSystemDb()
  const orgId = randomUUID()
  const slug = `verify-state-${suffix}-${created.length}`
  created.push(orgId)

  await db.insert(organisations).values({
    id: orgId,
    name: `State ${suffix}`,
    slug,
    plan: 'trial',
    status: 'active',
  })
  await db.insert(businesses).values({
    orgId,
    name: `State ${suffix}`,
    published,
    city: 'Kochi',
    tagline: 'Draft isolation check',
    settings: { brand: { primary: '#183d33', theme: 'editorial', font: 'serif' } },
  })
  return { orgId, slug }
}

async function writeDraft(orgId: string, key: 'faq' | 'team', config: unknown): Promise<void> {
  const db = getSystemDb()
  const [existing] = await db
    .select({ id: storefrontSections.id })
    .from(storefrontSections)
    .where(and(eq(storefrontSections.orgId, orgId), eq(storefrontSections.key, key)))
    .limit(1)

  if (existing) {
    await db
      .update(storefrontSections)
      .set({ config: config as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(storefrontSections.id, existing.id))
    return
  }

  await db.insert(storefrontSections).values({
    orgId,
    key,
    position: 0,
    config: config as Record<string, unknown>,
  })
}

describe.skipIf(!LIVE)('published state', { timeout: 20_000 }, () => {
  beforeAll(() => {
    try {
      process.loadEnvFile('.env.local')
    } catch {
      // The command may already have exported the environment.
    }
  })

  it('does not serve a page that claims to be published without a version', async () => {
    const { slug, orgId } = await seed(true)

    expect(await getPublicProfile(slug)).toBeNull()

    const published = await publishStorefront(orgId, null, getSystemDb())
    expect(published).toMatchObject({ ok: true, version: 1 })

    const page = await getPublicProfile(slug)
    expect(page).not.toBeNull()
    expect(page?.name).toBe(`State ${suffix}`)
  })

  it('keeps FAQ and team edits off the public page until they are published', async () => {
    const { orgId, slug } = await seed(false)
    const db = getSystemDb()

    const first = await publishStorefront(orgId, null, db)
    expect(first).toMatchObject({ ok: true, version: 1 })

    // Draft-only edits: a question and a team member the owner is still writing.
    await writeDraft(orgId, 'faq', {
      faq: [{ id: randomUUID(), question: 'Draft question?', answer: 'Draft answer.' }],
      team: [],
    })
    await writeDraft(orgId, 'team', {
      faq: [],
      team: [{ id: randomUUID(), name: 'Draft name', role: 'Draft role' }],
    })

    const beforePublish = await getPublicProfile(slug)
    const faqSection = beforePublish?.sections.find((section) => section.key === 'faq')
    const teamSection = beforePublish?.sections.find((section) => section.key === 'team')
    expect(faqSection?.config.faq).toEqual([])
    expect(teamSection?.config.team).toEqual([])

    const second = await publishStorefront(orgId, null, db)
    expect(second).toMatchObject({ ok: true, version: 2 })

    const afterPublish = await getPublicProfile(slug)
    const publishedFaq = afterPublish?.sections.find((section) => section.key === 'faq')
    const publishedTeam = afterPublish?.sections.find((section) => section.key === 'team')
    expect(publishedFaq?.config.faq).toHaveLength(1)
    expect(publishedFaq?.config.faq[0]?.question).toBe('Draft question?')
    expect(publishedTeam?.config.team[0]?.name).toBe('Draft name')
  })

  it('does not serve the draft when the published snapshot is unreadable', async () => {
    const { orgId, slug } = await seed(false)
    const db = getSystemDb()

    const published = await publishStorefront(orgId, null, db)
    expect(published).toMatchObject({ ok: true, version: 1 })

    // Simulate a snapshot written by a build this one cannot understand. The
    // version pointer still exists, so falling back to the draft would leak it.
    await db
      .update(storefrontVersions)
      .set({
        snapshot: sql`jsonb_set(${storefrontVersions.snapshot}, '{schemaVersion}', '99'::jsonb)`,
      })
      .where(eq(storefrontVersions.orgId, orgId))

    expect(await getPublicProfile(slug)).toBeNull()
  })
})

afterAll(async () => {
  if (!LIVE || created.length === 0) return
  const db = getSystemDb()
  for (const id of created) {
    await db.delete(organisations).where(eq(organisations.id, id))
  }
})
