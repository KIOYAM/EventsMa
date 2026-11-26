/**
 * Proves the public view counter end to end against a running app.
 *
 * Finds a real published storefront, posts the same beacon payload the browser
 * sends with a unique campaign marker, and reads the rollup row back. A draft
 * business is posted too, and must write nothing. Every row this script creates
 * is deleted in a `finally`.
 *
 *   npx next start -p 3100
 *   npx vite-node -c vitest.config.ts scripts/verify-storefront-attribution.ts http://localhost:3100
 *
 * Exit codes: 0 = every check passed, 1 = a check failed, 2 = nothing to test.
 */
import { and, eq, inArray } from 'drizzle-orm'
import { loadEnvConfig } from '@next/env'
import { getSystemDb } from '@/lib/db/client'
import {
  businesses,
  memberships,
  organisations,
  storefrontViews,
} from '@/lib/db/schema'
import { withWorkspace } from '@/lib/db/workspace'
import { getStorefrontAnalytics } from '@/lib/db/storefront-analytics'

loadEnvConfig(process.cwd())

const base = (process.argv[2] ?? 'http://localhost:3100').replace(/\/$/, '')
const db = getSystemDb()
const markers: string[] = []
const results: { name: string; pass: boolean; detail: string }[] = []

function check(name: string, pass: boolean, detail: string): void {
  results.push({ name, pass, detail })
}

async function published() {
  const [row] = await db
    .select({ id: organisations.id, slug: organisations.slug })
    .from(organisations)
    .innerJoin(businesses, eq(businesses.orgId, organisations.id))
    .where(eq(businesses.published, true))
    .limit(1)
  return row
}

async function draft() {
  const [row] = await db
    .select({ id: organisations.id, slug: organisations.slug })
    .from(organisations)
    .innerJoin(businesses, eq(businesses.orgId, organisations.id))
    .where(eq(businesses.published, false))
    .limit(1)
  return row
}

async function post(slug: string, marker: string): Promise<number> {
  const response = await fetch(`${base}/api/storefront/view`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug,
      referrer: 'https://www.instagram.com/p/Cverify',
      query: `?utm_source=verify&utm_medium=script&utm_campaign=${marker}`,
    }),
  })
  return response.status
}

try {
  const live = await published()
  if (!live) {
    console.error('SKIP: this database has no published storefront.')
    process.exit(2)
  }

  const marker = `verify-${Date.now()}`
  markers.push(marker)

  const first = await post(live.slug, marker)
  check('beacon answers 204', first === 204, `status ${first}`)

  const where = and(
    eq(storefrontViews.orgId, live.id),
    eq(storefrontViews.utmCampaign, marker),
  )
  const [row] = await db.select().from(storefrontViews).where(where).limit(1)
  check('one rollup row was written', Boolean(row), row ? `views ${row.views}` : 'missing')
  check('path is the public page', row?.path === `/p/${live.slug}`, row?.path ?? 'missing')
  check('referrer is reduced to a host', row?.referrerHost === 'instagram.com', row?.referrerHost ?? '')
  check('UTM fields are kept', row?.utmSource === 'verify' && row?.utmMedium === 'script', `${row?.utmSource}/${row?.utmMedium}`)
  check('first view counts once', row?.views === 1, String(row?.views))

  const second = await post(live.slug, marker)
  const [again] = await db.select().from(storefrontViews).where(where).limit(1)
  check('same source increments the same row', second === 204 && again?.views === 2, `views ${again?.views}`)

  // The owner's page reads through RLS, not the system connection. Run that
  // exact query so a bad date expression or policy cannot hide behind a green
  // build.
  const [owner] = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, live.id), eq(memberships.status, 'active')))
    .limit(1)
  if (owner) {
    const analytics = await withWorkspace(
      { userId: owner.userId, orgId: live.id, role: owner.role, demo: false },
      () => getStorefrontAnalytics(live.id, false),
    )
    check(
      'owner reads the rollup under RLS',
      analytics.views >= 2,
      `${analytics.views} views, ${analytics.enquiries} enquiries`,
    )
  } else {
    check('owner reads the rollup under RLS', false, 'no active member for the live org')
  }

  const hidden = await draft()
  if (hidden) {
    const draftMarker = `verify-draft-${Date.now()}`
    markers.push(draftMarker)
    await post(hidden.slug, draftMarker)
    const [draftRow] = await db
      .select()
      .from(storefrontViews)
      .where(and(eq(storefrontViews.orgId, hidden.id), eq(storefrontViews.utmCampaign, draftMarker)))
      .limit(1)
    check('a draft page writes nothing', !draftRow, draftRow ? 'unexpected row' : 'no row')
  }
} finally {
  if (markers.length > 0) {
    await db.delete(storefrontViews).where(inArray(storefrontViews.utmCampaign, markers))
  }
}

for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name} — ${result.detail}`)
}

const failed = results.filter((result) => !result.pass).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed === 0 ? 0 : 1)
