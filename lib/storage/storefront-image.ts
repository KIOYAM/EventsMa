import 'server-only'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import {
  ACCEPTED_PORTFOLIO_TYPES,
  SIGNED_URL_TTL_SECONDS,
  imageStorageEnv,
  validatePortfolioImage,
} from './portfolio-images'

/**
 * Storefront photography.
 *
 * One image per section, one section today uses it (the hero). It shares the
 * portfolio bucket so a workspace has a single quota and a single set of
 * credentials, but lives under its own prefix: `${orgId}/storefront/...`, so one
 * tenant's object path is useless to another even if it leaks.
 */
export async function uploadStorefrontImage(
  orgId: string,
  file: File,
): Promise<{ path: string; bytes: number }> {
  const env = imageStorageEnv()
  if (!env) throw new Error('Image storage is not configured')

  const check = validatePortfolioImage(file)
  if (!check.ok) throw new Error(`Invalid image: ${check.reason}`)

  const client = createClient(env.url, env.key, { auth: { persistSession: false } })
  const path = `${orgId}/storefront/${randomUUID()}.${check.ext}`
  const { error } = await client.storage
    .from(env.bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: check.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Storefront upload failed: ${error.message}`)
  return { path, bytes: check.bytes }
}

/** One minute: long enough for the proxy to fetch, short enough to stay private. */
const PROXY_SIGNED_URL_TTL_SECONDS = 60

async function signStorefrontObject(
  path: string | null | undefined,
  ttlSeconds: number,
): Promise<string | null> {
  const trimmed = path?.trim()
  const env = imageStorageEnv()
  if (!env || !trimmed) return null

  try {
    const client = createClient(env.url, env.key, { auth: { persistSession: false } })
    const { data, error } = await client.storage
      .from(env.bucket)
      .createSignedUrl(trimmed, ttlSeconds)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  } catch {
    return null
  }
}

/** A private object becomes a short-lived URL, or null when it cannot be signed. */
export async function signedStorefrontImage(
  path: string | null | undefined,
): Promise<string | null> {
  return signStorefrontObject(path, SIGNED_URL_TTL_SECONDS)
}

/**
 * The storage hop behind `/api/storefront/image`. The browser only ever sees the
 * signed proxy URL, so this credential-bearing URL lives for a minute.
 */
export async function signedStorefrontImageUrl(
  path: string | null | undefined,
): Promise<string | null> {
  return signStorefrontObject(path, PROXY_SIGNED_URL_TTL_SECONDS)
}

export async function removeStorefrontImage(path: string | null | undefined): Promise<void> {
  const trimmed = path?.trim()
  const env = imageStorageEnv()
  if (!env || !trimmed) return
  try {
    const client = createClient(env.url, env.key, { auth: { persistSession: false } })
    await client.storage.from(env.bucket).remove([trimmed])
  } catch {
    // A missing object must not block the owner from clearing the row.
  }
}

/** Re-exported so the builder can label its constraints without a second import. */
export const STOREFRONT_IMAGE_TYPES = ACCEPTED_PORTFOLIO_TYPES
