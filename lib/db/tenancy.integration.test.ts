import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDb, getSystemDb } from './client'
import { clients, memberships, organisations } from './schema'
import { withWorkspace } from './workspace'
import { hasScopedDb } from './workspace-context'

/**
 * Proves RLS applies to the app's own query path.
 *
 * Live database only: two committed temporary tenants, then removed. Run with
 *   TENANCY_LIVE_TEST=1 npx vitest run lib/db/tenancy.integration.test.ts
 * It is skipped in the default suite so a normal test run needs no database.
 */
const LIVE = process.env.TENANCY_LIVE_TEST === '1'

describe.skipIf(!LIVE)('runtime tenancy through getDb', () => {
  const suffix = randomUUID().slice(0, 8)
  const orgA = randomUUID()
  const orgB = randomUUID()
  const userA = randomUUID()
  const userB = randomUUID()
  const ctxA = { userId: userA, orgId: orgA, role: 'owner' as const, demo: false }
  const ctxB = { userId: userB, orgId: orgB, role: 'owner' as const, demo: false }

  beforeAll(async () => {
    try {
      process.loadEnvFile('.env.local')
    } catch {
      // The command may already have the environment exported.
    }
    const db = getSystemDb()
    await db.insert(organisations).values([
      { id: orgA, name: `RLS A ${suffix}`, slug: `rls-a-${suffix}`, plan: 'trial', status: 'active' },
      { id: orgB, name: `RLS B ${suffix}`, slug: `rls-b-${suffix}`, plan: 'trial', status: 'active' },
    ])
    await db.insert(memberships).values([
      { orgId: orgA, userId: userA, role: 'owner', status: 'active', email: `a-${suffix}@rls.test` },
      { orgId: orgB, userId: userB, role: 'owner', status: 'active', email: `b-${suffix}@rls.test` },
    ])
    await db.insert(clients).values([
      { orgId: orgA, name: 'Tenant A client' },
      { orgId: orgB, name: 'Tenant B client' },
    ])
  })

  afterAll(async () => {
    if (!LIVE) return
    const db = getSystemDb()
    await db.delete(organisations).where(eq(organisations.id, orgA))
    await db.delete(organisations).where(eq(organisations.id, orgB))
  })

  it('exposes the scoped handle only inside the callback', async () => {
    expect(hasScopedDb()).toBe(false)
    await withWorkspace(ctxA, async () => {
      expect(hasScopedDb()).toBe(true)
    })
    expect(hasScopedDb()).toBe(false)
  })

  it('returns only tenant A rows for an unfiltered select', async () => {
    const rows = await withWorkspace(ctxA, () =>
      getDb().select({ orgId: clients.orgId, name: clients.name }).from(clients),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.orgId).toBe(orgA)
    expect(rows.some((row) => row.orgId === orgB)).toBe(false)
  })

  it('returns zero rows when A asks for B by id', async () => {
    const rows = await withWorkspace(ctxA, () =>
      getDb().select({ id: clients.id }).from(clients).where(eq(clients.orgId, orgB)),
    )
    expect(rows).toHaveLength(0)
  })

  it('rejects an insert carrying another tenant org_id', async () => {
    await expect(
      withWorkspace(ctxA, () =>
        getDb().insert(clients).values({ orgId: orgB, name: 'Injected by A' }),
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('allows A to insert and read back its own row', async () => {
    const id = await withWorkspace(ctxA, async () => {
      const [created] = await getDb()
        .insert(clients)
        .values({ orgId: orgA, name: 'Tenant A second client' })
        .returning({ id: clients.id })
      return created?.id
    })
    expect(id).toBeTruthy()
    const read = await withWorkspace(ctxB, () =>
      getDb().select({ id: clients.id }).from(clients).where(eq(clients.id, id as string)),
    )
    expect(read).toHaveLength(0)
  })
})
