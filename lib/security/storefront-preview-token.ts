import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A shareable preview link, signed rather than stored.
 *
 * The owner preview (`/p/[slug]/preview`) needs a session. A client does not have
 * one, so this token is the authorisation: an HMAC over the organisation, the
 * slug and an expiry. No new table, nothing to revoke one by one — the link dies
 * on its own, and rotating the service key invalidates every outstanding link.
 *
 * The org id is part of the signature on purpose. Slugs are editable, so a tenant
 * that renames its slug must not hand an old preview link to whoever takes the
 * old one; the token is checked against the slug's current organisation.
 *
 * The derived key is not the service-role key itself: a value that can read every
 * tenant is never used directly as a signing secret.
 */
const PREVIEW_TTL_DAYS = 7
const DAY_MS = 86_400_000
const DAY_SECONDS = 86_400
/** Longer than any token this module mints; anything bigger is rejected unread. */
const MAX_TOKEN_LENGTH = 512

interface PreviewClaims {
  orgId: string
  slug: string
  /** Unix seconds. */
  exp: number
}

function signingKey(): string | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceKey) return null
  return createHmac('sha256', serviceKey).update('eventsma:storefront-preview:v1').digest('hex')
}

function signature(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url')
}

/**
 * Expiry is rounded up to the end of a UTC day so the URL an owner copies does
 * not change on every render — a link that mutates while they paste it into
 * WhatsApp is worse than one that lives a few hours longer.
 */
function expiryFor(now: Date): number {
  const target = now.getTime() + PREVIEW_TTL_DAYS * DAY_MS
  return Math.ceil(target / DAY_MS) * DAY_SECONDS
}

export function createPreviewToken(input: {
  orgId: string
  slug: string
  now?: Date
}): string | null {
  const key = signingKey()
  if (!key) return null
  if (!input.orgId || !input.slug) return null

  const claims: PreviewClaims = {
    orgId: input.orgId,
    slug: input.slug,
    exp: expiryFor(input.now ?? new Date()),
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${payload}.${signature(payload, key)}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/

/** Null for anything malformed, tampered with, expired or signed by another key. */
export function verifyPreviewToken(token: string, now: Date = new Date()): PreviewClaims | null {
  const key = signingKey()
  if (!key || token.length > MAX_TOKEN_LENGTH) return null

  const [payload, provided] = token.split('.')
  if (!payload || !provided) return null

  const expected = signature(payload, key)
  const actualBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null
  }

  let raw: unknown
  try {
    raw = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (typeof raw !== 'object' || raw === null) return null

  const value = raw as Record<string, unknown>
  if (typeof value.orgId !== 'string' || !UUID_RE.test(value.orgId)) return null
  if (typeof value.slug !== 'string' || !SLUG_RE.test(value.slug)) return null
  if (typeof value.exp !== 'number' || !Number.isFinite(value.exp)) return null
  if (value.exp * 1000 <= now.getTime()) return null

  return { orgId: value.orgId, slug: value.slug, exp: value.exp }
}
