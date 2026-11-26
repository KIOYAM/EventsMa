/**
 * Proves the storefront image pipeline end to end against a running app.
 *
 * It uploads one 1×1 PNG under a throwaway tenant prefix, asks the proxy for it,
 * asks the Next image optimizer for the same URL, and deletes the object in a
 * `finally`. Run the app first:
 *
 *   npx next start -p 3100
 *   npx vite-node -c vitest.config.ts scripts/verify-storefront-images.ts http://localhost:3100
 *
 * Nothing is printed except pass/fail lines and status codes.
 */
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'
import { storefrontImageUrl } from '@/lib/storage/image-url'

loadEnvConfig(process.cwd())

const base = (process.argv[2] ?? 'http://localhost:3100').replace(/\/$/, '')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const bucket = process.env.PORTFOLIO_BUCKET?.trim() || 'portfolio'

if (!supabaseUrl || !serviceKey) {
  console.error('SKIP: Supabase storage is not configured in this environment.')
  process.exit(2)
}

/**
 * A real 1200×630 PNG already in the repo. It matters that this is a normal
 * photograph-sized image: Next's optimizer falls back to the original bytes for
 * a 1×1 source, so a tiny fixture would not prove format negotiation.
 */
const objectPath = `${randomUUID()}/storefront/${randomUUID()}.png`
const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

const results: { name: string; pass: boolean; detail: string }[] = []
function check(name: string, pass: boolean, detail: string): void {
  results.push({ name, pass, detail })
}

try {
  const png = await readFile('app/opengraph-image.png')
  const { error } = await client.storage.from(bucket).upload(objectPath, png, {
    contentType: 'image/png',
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(`upload failed: ${error.message}`)

  const proxyUrl = storefrontImageUrl(objectPath)
  if (!proxyUrl) throw new Error('could not sign the object path')

  const proxy = await fetch(`${base}${proxyUrl}`)
  check('proxy returns 200', proxy.status === 200, `status ${proxy.status}`)
  check(
    'proxy serves an image',
    (proxy.headers.get('content-type') ?? '').startsWith('image/'),
    proxy.headers.get('content-type') ?? 'no content-type',
  )
  check(
    'proxy is immutable for a week',
    /immutable/.test(proxy.headers.get('cache-control') ?? ''),
    proxy.headers.get('cache-control') ?? 'no cache-control',
  )

  const tampered = `${proxyUrl.slice(0, -1)}${proxyUrl.endsWith('A') ? 'B' : 'A'}`
  const rejected = await fetch(`${base}${tampered}`)
  check('tampered signature is 404', rejected.status === 404, `status ${rejected.status}`)

  const optimizerUrl = `${base}/_next/image?url=${encodeURIComponent(proxyUrl)}&w=640&q=75`
  const optimized = await fetch(optimizerUrl, {
    headers: { accept: 'image/avif,image/webp,image/*,*/*' },
  })
  const optimizedType = optimized.headers.get('content-type') ?? ''
  check('optimizer returns 200', optimized.status === 200, `status ${optimized.status}`)
  check(
    'optimizer negotiates a modern format',
    optimizedType === 'image/avif' || optimizedType === 'image/webp',
    optimizedType || 'no content-type',
  )
} catch (error) {
  check('pipeline ran', false, error instanceof Error ? error.message : String(error))
} finally {
  await client.storage.from(bucket).remove([objectPath])
}

for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}  (${result.detail})`)
}

if (results.some((result) => !result.pass)) process.exitCode = 1
