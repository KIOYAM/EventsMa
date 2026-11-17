import 'server-only'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

/**
 * Portfolio photography.
 *
 * Deliberately separate from the menu bucket, and deliberately private: a
 * portfolio is work done for named clients, so the object is served through a
 * signed URL with an expiry rather than a permanently public path that anyone can
 * re-share after the owner hides the entry.
 *
 * The browser compresses before upload (see `photo-upload.tsx`); the limits below
 * are the server's own opinion and are enforced regardless of what the client did.
 */
export const MAX_PORTFOLIO_BYTES = 400 * 1024
export const ACCEPTED_PORTFOLIO_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
/** Long enough that a page cached for five minutes never serves an expired link. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

export type PortfolioRejection = 'empty' | 'type' | 'size'

const EXT: Record<(typeof ACCEPTED_PORTFOLIO_TYPES)[number], string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export function validatePortfolioImage(
  file: File,
):
  | { ok: true; bytes: number; type: (typeof ACCEPTED_PORTFOLIO_TYPES)[number]; ext: string }
  | { ok: false; reason: PortfolioRejection } {
  if (!file || file.size === 0) return { ok: false, reason: 'empty' }
  const type = ACCEPTED_PORTFOLIO_TYPES.find((accepted) => accepted === file.type)
  if (!type) return { ok: false, reason: 'type' }
  if (file.size > MAX_PORTFOLIO_BYTES) return { ok: false, reason: 'size' }
  return { ok: true, bytes: file.size, type, ext: EXT[type] }
}

function storageEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return { url, key, bucket: process.env.PORTFOLIO_BUCKET?.trim() || 'portfolio' }
}

export function isPortfolioStorageConfigured(): boolean {
  return storageEnv() !== null
}

/**
 * Shared bucket coordinates for every owner-uploaded image (portfolio, hero).
 * Exported so the storefront uploader reuses the same private bucket instead of
 * inventing a second one — one bucket, one quota, one set of credentials.
 */
export function imageStorageEnv() {
  return storageEnv()
}

export class PortfolioStorageUnavailable extends Error {
  constructor() {
    super('Portfolio storage is not configured')
    this.name = 'PortfolioStorageUnavailable'
  }
}

/** Paths are namespaced by org, so one tenant's object path is useless to another. */
export async function uploadPortfolioImage(
  orgId: string,
  itemId: string,
  file: File,
): Promise<{ path: string; bytes: number }> {
  const env = storageEnv()
  if (!env) throw new PortfolioStorageUnavailable()

  const check = validatePortfolioImage(file)
  if (!check.ok) throw new Error(`Invalid image: ${check.reason}`)

  const client = createClient(env.url, env.key, { auth: { persistSession: false } })
  const path = `${orgId}/${itemId}/${randomUUID()}.${check.ext}`

  const { error } = await client.storage
    .from(env.bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: check.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Portfolio upload failed: ${error.message}`)
  return { path, bytes: check.bytes }
}

export async function removePortfolioImage(path: string | null): Promise<void> {
  const env = storageEnv()
  const trimmed = path?.trim()
  if (!env || !trimmed) return
  try {
    const client = createClient(env.url, env.key, { auth: { persistSession: false } })
    await client.storage.from(env.bucket).remove([trimmed])
  } catch {
    // A missing object must not block the owner from clearing the row.
  }
}

/**
 * Signed, expiring URLs for the public page. Returns a path → URL map so callers
 * never have to guess which entries failed to sign (an unconfigured or unhappy
 * storage returns an empty map and the gallery simply does not render).
 */
export async function signedPortfolioUrls(
  paths: readonly (string | null | undefined)[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const env = storageEnv()
  if (!env) return result

  const clean = [...new Set(paths.filter((path): path is string => Boolean(path?.trim())))]
  if (clean.length === 0) return result

  try {
    const client = createClient(env.url, env.key, { auth: { persistSession: false } })
    const { data, error } = await client.storage
      .from(env.bucket)
      .createSignedUrls(clean, SIGNED_URL_TTL_SECONDS)
    if (error || !data) return result
    for (const entry of data) {
      if (entry.path && entry.signedUrl) result.set(entry.path, entry.signedUrl)
    }
  } catch {
    return result
  }

  return result
}
