import 'server-only'
import { desc, sql } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { organisations } from './schema'

export interface PlatformOrgRow {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  createdAt: string
  members: number
  eventCount: number
}

const DEMO_ORGS: PlatformOrgRow[] = [
  {
    id: '00000000-0000-4000-8000-00000000c001',
    name: 'Kerala Kitchen Co.',
    slug: 'kerala-kitchen',
    plan: 'growth',
    status: 'active',
    createdAt: '2026-01-12',
    members: 6,
    eventCount: 14,
  },
  {
    id: '00000000-0000-4000-8000-00000000c002',
    name: 'Backwater Events',
    slug: 'backwater-events',
    plan: 'trial',
    status: 'active',
    createdAt: '2026-09-02',
    members: 2,
    eventCount: 3,
  },
]

/**
 * Cross-tenant read, restricted to platform staff by the page's email gate.
 * Counts are correlated subqueries so one row per organisation comes back,
 * instead of a join that multiplies rows and a client-side regroup.
 */
export async function getPlatformOrgs(demo: boolean): Promise<PlatformOrgRow[]> {
  if (demo || !isDatabaseConfigured()) return DEMO_ORGS

  const rows = await getDb()
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      plan: organisations.plan,
      status: organisations.status,
      createdAt: organisations.createdAt,
      // Qualified names by hand: Drizzle renders a column inside a raw fragment
      // unqualified, which would compare the inner table to itself and count 0.
      members: sql<number>`(
        select count(*)::int from memberships m where m.org_id = organisations.id
      )`,
      eventCount: sql<number>`(
        select count(*)::int from events e where e.org_id = organisations.id
      )`,
    })
    .from(organisations)
    .orderBy(desc(organisations.createdAt))
    .limit(200)

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    members: Number(row.members),
    eventCount: Number(row.eventCount),
  }))
}
