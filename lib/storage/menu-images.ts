import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * Image rules for menu photography.
 *
 * Uploads are the fastest way to blow a storage quota and a mobile data plan, so
 * the limits are enforced on the server, not only in the file picker. A rejected
 * upload returns a reason code the UI can explain.
 */
export const MAX_IMAGE_BYTES = 200 * 1024
export const ORG_IMAGE_QUOTA_BYTES = 25 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const

export type ImageRejection = 'empty' | 'type' | 'size'

export type ImageCheck =
  | { ok: true; bytes: number; type: (typeof ACCEPTED_IMAGE_TYPES)[number]; ext: string }
  | { ok: false; reason: ImageRejection }

const EXT: Record<(typeof ACCEPTED_IMAGE_TYPES)[number], string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export function validateMenuImage(file: File): ImageCheck {
  if (!file || file.size === 0) return { ok: false, reason: 'empty' }
  const type = ACCEPTED_IMAGE_TYPES.find((accepted) => accepted === file.type)
  if (!type) return { ok: false, reason: 'type' }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: 'size' }
  return { ok: true, bytes: file.size, type, ext: EXT[type] }
}

function storageEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return { url, key, bucket: process.env.MENU_IMAGE_BUCKET?.trim() || 'menu' }
}

export function isImageStorageConfigured(): boolean {
  return storageEnv() !== null
}

export class ImageStorageUnavailable extends Error {
  constructor() {
    super('Image storage is not configured')
    this.name = 'ImageStorageUnavailable'
  }
}

/**
 * Uploads to Supabase Storage when configured. The object path is namespaced by
 * org, so a leaked path from one tenant cannot be reused against another.
 */
export async function uploadMenuImage(orgId: string, file: File): Promise<{ path: string; bytes: number }> {
  const env = storageEnv()
  if (!env) throw new ImageStorageUnavailable()

  const check = validateMenuImage(file)
  if (!check.ok) throw new Error(`Invalid image: ${check.reason}`)

  const client = createClient(env.url, env.key, { auth: { persistSession: false } })
  const path = `${orgId}/${randomUUID()}.${check.ext}`
  const { error } = await client.storage
    .from(env.bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: check.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) throw new Error(`Image upload failed: ${error.message}`)
  return { path, bytes: check.bytes }
}
