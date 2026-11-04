/**
 * Copies the non-empty values from .env.local into a Vercel project.
 *
 *   node scripts/sync-vercel-env.mjs preview production
 *
 * Uses the Vercel REST API with the token the CLI already stored in
 * .cache/vercel/auth.json, because one CLI process per variable takes minutes.
 * Values are never printed: only the key and the outcome are logged.
 * Re-running replaces the existing value for that key and environment.
 */
import { existsSync, readFileSync } from 'node:fs'

const PUBLIC = new Set(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_APP_URL'])

/** Vercel needs the deployed origin, not the localhost value used by next dev. */
const APP_URL_OVERRIDE = process.env.SYNC_APP_URL?.trim()

const KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'BUSINESS_UPI_VPA',
  'PLATFORM_ADMIN_EMAILS',
]

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('usage: node scripts/sync-vercel-env.mjs <preview|production> [...]')
  process.exit(2)
}
if (!existsSync('.env.local')) {
  console.error('missing .env.local')
  process.exit(2)
}

process.loadEnvFile('.env.local')

const projectFile = '.vercel/project.json'
if (!existsSync(projectFile)) {
  console.error('missing .vercel/project.json — run vercel link first')
  process.exit(2)
}
const { projectId, orgId } = JSON.parse(readFileSync(projectFile, 'utf8'))

const authFile = '.cache/vercel/auth.json'
if (!existsSync(authFile)) {
  console.error('missing .cache/vercel/auth.json — run vercel login first')
  process.exit(2)
}
const { token } = JSON.parse(readFileSync(authFile, 'utf8'))
if (!token) {
  console.error('no token in .cache/vercel/auth.json')
  process.exit(2)
}

const api = `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${orgId}&upsert=true`

async function put(target, key, value) {
  const response = await fetch(api, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      value,
      target: [target],
      type: PUBLIC.has(key) ? 'plain' : 'sensitive',
    }),
  })
  if (!response.ok) {
    const body = await response.text()
    // The error body never contains the value we sent.
    throw new Error(`${response.status} ${body.slice(0, 240)}`)
  }
}

let set = 0
let blank = 0
let failed = 0

for (const target of targets) {
  for (const key of KEYS) {
    const value =
      key === 'NEXT_PUBLIC_APP_URL' && APP_URL_OVERRIDE ? APP_URL_OVERRIDE : process.env[key]?.trim()
    if (!value) {
      blank += 1
      continue
    }
    try {
      await put(target, key, value)
      set += 1
      console.log(`set   ${key}  ${target}`)
    } catch (error) {
      failed += 1
      console.error(`FAIL  ${key}  ${target}  ${error.message}`)
    }
  }
}

console.log(`\n${set} set, ${blank} blank, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
