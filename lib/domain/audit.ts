/**
 * The audit trail, made readable.
 *
 * Writers store an action as `<domain>.<verb>` (`invoice.created`,
 * `team.invitation_accepted`) plus a small `after` payload. Nothing here decides
 * whether a change was allowed: it only turns those strings into something a
 * person can scan. An action the label table does not know still renders, because
 * a log that silently drops unfamiliar rows is worse than an awkward label.
 */

import { formatINR } from './money'

/** Entities the platform writes today. A new writer may use another; the UI copes. */
export const AUDIT_ENTITIES = ['invoice', 'quotation', 'invitation', 'payment'] as const
export type AuditEntity = (typeof AUDIT_ENTITIES)[number]

export interface AuditRow {
  id: string
  /**
   * Who did it, or null when nobody signed in did: a client token path, or a
   * system job. The distinction matters, so callers label null explicitly.
   */
  actorName: string | null
  action: string
  entity: string
  entityId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  /** ISO string: rows cross the server/client boundary as data, not as Dates. */
  createdAt: string
}

export function isAuditEntity(value: string | null | undefined): value is AuditEntity {
  return typeof value === 'string' && (AUDIT_ENTITIES as readonly string[]).includes(value)
}

/**
 * Fallback label for an action with no catalogue entry.
 * `team.invitation_accepted` → `Team invitation accepted`.
 */
export function humaniseAction(action: string): string {
  const words = action.replace(/[._]+/g, ' ').trim()
  if (!words) return action
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Where a row points, or null when the entity has no detail screen of its own. */
export function auditEntityHref(entity: string, entityId: string | null): string | null {
  if (!entityId) return null
  switch (entity) {
    case 'invoice':
      return `/invoices/${entityId}`
    case 'quotation':
      return `/quotes/${entityId}`
    case 'invitation':
      return '/team'
    default:
      return null
  }
}

export interface AuditField {
  key: string
  label: string
  value: string
}

/**
 * `amountPaise` → `Amount`, `acceptedByEmail` → `Accepted by email`.
 * The storage suffix names a unit, not the thing being shown, so it is dropped
 * rather than read aloud. No acronyms are stored, so no dictionary is needed.
 */
export function humaniseKey(key: string): string {
  const base = key.replace(/(Paise|Id)$/, '') || key
  const words = base
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (!words) return key
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function describeValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  // Money is integer paise: printing the raw number asks the reader to divide in
  // their head, which is exactly where a misread of the log starts.
  if (key.endsWith('Paise') && typeof value === 'number') return formatINR(value, { showPaise: true })
  // Ids are noise in a list. The row's own link is the way to the record.
  if (key.endsWith('Id') && typeof value === 'string' && UUID_RE.test(value)) return value.slice(0, 8)
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/** A payload as display rows. Unusable values are omitted rather than shown as "null". */
export function auditFields(
  payload: Record<string, unknown> | null | undefined,
): AuditField[] {
  if (!payload) return []
  const fields: AuditField[] = []
  for (const [key, value] of Object.entries(payload)) {
    const text = describeValue(key, value)
    if (text === null) continue
    fields.push({ key, label: humaniseKey(key), value: text })
  }
  // A payload is written by us, not by a customer; more than eight fields would
  // mean one row is trying to be a detail screen.
  return fields.slice(0, 8)
}
