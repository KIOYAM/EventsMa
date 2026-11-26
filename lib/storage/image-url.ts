import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Stable, signed URLs for storefront photographs.
 *
 * A Supabase signed URL carries a token that changes on every render, so an image
 * optimizer cannot cache it: every ISR pass looks like a new image. This module
 * signs the *object path* instead and points at our own proxy route, which keeps
 * the URL identical for a week. The proxy resolves the private object server-side.
 *
 * The window is quantised rather than rolling, so every render inside the same
 * seven-day bucket produces byte-identical markup. When an owner hides a work
 * entry, its last emitted URL stops working at the end of that window at the
 * latest — bounded, not immediate, and deliberately documented in the design note.
 */
const TOKEN_WINDOW_SECONDS = 7 * 24 * 60 * 60
const MAX_PATH_LENGTH = 400
/** `${orgId}/${...}`: org ids are UUIDs and every uploaded object lives below one. */
const PATH_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9][A-Za-z0-9/_.-]*$/i

export function isImagePath(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const path = value.trim()
  if (path.length === 0 || path.length > MAX_PATH_LENGTH) return false
  if (path.startsWith('/') || path.includes('..') || path.includes('\\')) return false
  return PATH_RE.test(path)
}

/**
 * A dedicated secret keeps image URLs independent of the storage credential.
 * The service key is the fallback so an existing deployment gains images without
 * a new environment variable; rotating it invalidates every outstanding URL.
 */
function signingKey(): string | null {
  const dedicated = process.env.STOREFRONT_IMAGE_SECRET?.trim()
  if (dedicated) return dedicated
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null
}

/** End of the current seven-day bucket, in Unix seconds. */
export function imageWindowEnd(nowMs: number = Date.now()): number {
  const now = Math.floor(nowMs / 1000)
  return (Math.floor(now / TOKEN_WINDOW_SECONDS) + 1) * TOKEN_WINDOW_SECONDS
}

export function signImagePath(path: string, exp: number, key: string): string {
  return createHmac('sha256', key).update(`${path}\n${exp}`).digest('base64url')
}

/**
 * The URL a page renders. Returns null when storage is not configured or the path
 * is not a tenant object path, so a bad row produces no image rather than an open
 * proxy onto the bucket.
 */
export function storefrontImageUrl(
  path: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  const trimmed = path?.trim()
  if (!trimmed || !isImagePath(trimmed)) return null

  const key = signingKey()
  if (!key) return null

  const exp = imageWindowEnd(nowMs)
  const sig = signImagePath(trimmed, exp, key)
  return `/api/storefront/image?p=${encodeURIComponent(trimmed)}&e=${exp}&s=${sig}`
}

/**
 * Verification for the proxy route. Every failure is the same `null`: the caller
 * answers 404, so a probe cannot tell an expired link from a forged one.
 */
export function verifyImageRequest(
  p: unknown,
  e: unknown,
  s: unknown,
  nowMs: number = Date.now(),
): string | null {
  if (!isImagePath(p)) return null
  const path = p.trim()

  const exp = Number(e)
  const sig = typeof s === 'string' ? s : ''
  if (!Number.isInteger(exp) || sig.length === 0) return null

  const now = Math.floor(nowMs / 1000)
  if (exp <= now) return null
  // A signature cannot be forged, but a bug that minted a year-long token should
  // still not turn into a year-long public URL.
  if (exp - now > TOKEN_WINDOW_SECONDS + 60) return null

  const key = signingKey()
  if (!key) return null

  const expected = Buffer.from(signImagePath(path, exp, key))
  const provided = Buffer.from(sig)
  if (expected.length !== provided.length) return null
  return timingSafeEqual(expected, provided) ? path : null
}
