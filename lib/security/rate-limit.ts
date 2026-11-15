import 'server-only'
import { sql } from 'drizzle-orm'
import { getSystemDb, isDatabaseConfigured } from '@/lib/db/client'

/**
 * Abuse control for the endpoints a stranger can call.
 *
 * A fixed window per (bucket, caller, window index) row, incremented with one
 * atomic upsert. Per-isolate `Map`s would not survive a serverless request; the
 * database is shared state this project already owns, so no new service is
 * needed for what is really just a counter.
 *
 * Fails **open**: if the counter cannot be written, the request proceeds. Losing
 * a customer's enquiry because the rate-limit table is unhappy is a worse
 * outcome than absorbing a burst, and the stored dedupe key still prevents the
 * same submission landing twice.
 */

export interface RateLimitVerdict {
  allowed: boolean
  hits: number
  limit: number
  retryAfterSeconds: number
}

/** Bucket names are constants at the call sites; keep them readable in the table. */
export type RateLimitBucket = 'share-submit-ip' | 'share-submit-token' | 'enquiry-ip'

export async function consumeRateLimit({
  bucket,
  identifier,
  limit,
  windowSeconds,
}: {
  bucket: RateLimitBucket
  identifier: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitVerdict> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const windowIndex = Math.floor(nowSeconds / windowSeconds)
  const retryAfterSeconds = windowSeconds - (nowSeconds % windowSeconds)
  const key = `${bucket}:${identifier}:${windowIndex}`.slice(0, 240)

  if (!isDatabaseConfigured()) {
    return { allowed: true, hits: 0, limit, retryAfterSeconds }
  }

  try {
    const rows = (await getSystemDb().execute(sql`
      insert into public.rate_limits (key, window_start, hits)
      values (${key}, to_timestamp(${windowIndex * windowSeconds}), 1)
      on conflict (key) do update set hits = public.rate_limits.hits + 1
      returning hits
    `)) as unknown as { hits: number }[]

    const hits = Number(rows[0]?.hits ?? 1)
    if (Math.random() < 0.02) void pruneRateLimits()
    return { allowed: hits <= limit, hits, limit, retryAfterSeconds }
  } catch {
    return { allowed: true, hits: 0, limit, retryAfterSeconds }
  }
}

/** Best effort; a failed prune must never affect the request that triggered it. */
export async function pruneRateLimits(): Promise<void> {
  try {
    await getSystemDb().execute(
      sql`delete from public.rate_limits where window_start < now() - interval '2 hours'`,
    )
  } catch {
    // ignored on purpose
  }
}

/**
 * The caller's address as the platform reports it.
 *
 * `x-forwarded-for` is a list; the first entry is the client. It is spoofable in
 * general — on Vercel it is set by the edge — so these limits are a speed bump
 * for scripts, not an identity. The per-token limit does not depend on it.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  if (first) return first.slice(0, 64)
  return request.headers.get('x-real-ip')?.trim().slice(0, 64) ?? 'unknown'
}

/**
 * A field no human fills in. Named plausibly so naive bots do; it is hidden from
 * sighted users, skipped by the keyboard and ignored by autofill.
 */
export const HONEYPOT_FIELD = 'website'

export function honeypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}
