import 'server-only'
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import type { AuditRow } from '@/lib/domain/audit'
import { demoAuditEvents } from '@/lib/demo/workspace'
import { getDb } from './client'
import { auditEvents, memberships } from './schema'

/**
 * One page answers "what happened this week" without a wall of rows. The extra
 * row fetched is the cursor's proof that an older page exists, not a real row.
 */
export const AUDIT_PAGE_SIZE = 40

export interface AuditQuery {
  entity?: string
  /** Cursor: return rows strictly older than this instant. */
  before?: Date
}

export interface AuditPageResult {
  rows: AuditRow[]
  hasMore: boolean
}

function applyQuery(rows: readonly AuditRow[], query: AuditQuery): AuditPageResult {
  const filtered = query.entity ? rows.filter((row) => row.entity === query.entity) : rows
  const ordered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const after = query.before
    ? ordered.filter((row) => new Date(row.createdAt).getTime() < query.before!.getTime())
    : ordered
  return {
    rows: after.slice(0, AUDIT_PAGE_SIZE),
    hasMore: after.length > AUDIT_PAGE_SIZE,
  }
}

/**
 * Rows for one organisation, newest first.
 *
 * The membership join is scoped by org as well as user: a person who belongs to
 * two workspaces must not be attributed by the other one's display name.
 */
export async function getAuditEvents(
  orgId: string,
  demo: boolean,
  query: AuditQuery = {},
): Promise<AuditPageResult> {
  if (demo) return applyQuery(demoAuditEvents, query)

  const filters = [eq(auditEvents.orgId, orgId)]
  if (query.entity) filters.push(eq(auditEvents.entity, query.entity))
  if (query.before) filters.push(lt(auditEvents.createdAt, query.before))

  const db = getDb()
  const rows = await db
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      entity: auditEvents.entity,
      entityId: auditEvents.entityId,
      before: auditEvents.before,
      after: auditEvents.after,
      createdAt: auditEvents.createdAt,
      actorName: memberships.displayName,
      actorEmail: memberships.email,
    })
    .from(auditEvents)
    .leftJoin(
      memberships,
      and(eq(memberships.userId, auditEvents.actorId), eq(memberships.orgId, auditEvents.orgId)),
    )
    .where(and(...filters))
    .orderBy(desc(auditEvents.createdAt))
    .limit(AUDIT_PAGE_SIZE + 1)

  const hasMore = rows.length > AUDIT_PAGE_SIZE
  return {
    rows: rows.slice(0, AUDIT_PAGE_SIZE).map((row) => ({
      id: row.id,
      // An invitation accepted by a member who has since left has no membership
      // row to join; the email they joined with is still the truest attribution.
      actorName: row.actorName?.trim() || row.actorEmail?.trim() || null,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      before: row.before ?? null,
      after: row.after ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    hasMore,
  }
}

export interface AuditEntityCount {
  entity: string
  count: number
}

/** Counts drive the filter row, so it only offers entities this log actually has. */
export async function getAuditEntityCounts(
  orgId: string,
  demo: boolean,
): Promise<AuditEntityCount[]> {
  if (demo) {
    const counts = new Map<string, number>()
    for (const row of demoAuditEvents) counts.set(row.entity, (counts.get(row.entity) ?? 0) + 1)
    return [...counts].map(([entity, count]) => ({ entity, count })).sort((a, b) => b.count - a.count)
  }

  const db = getDb()
  const rows = await db
    .select({ entity: auditEvents.entity, count: sql<number>`count(*)::int` })
    .from(auditEvents)
    .where(eq(auditEvents.orgId, orgId))
    .groupBy(auditEvents.entity)

  return rows
    .map((row) => ({ entity: row.entity, count: Number(row.count) }))
    .sort((a, b) => b.count - a.count)
}
