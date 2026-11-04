/**
 * Creates (or repairs) the platform super-admin account.
 *
 *   node scripts/seed-superadmin.mjs
 *
 * Reads .env.local, creates the auth user through the Supabase Admin API with the
 * service-role key, then creates the organisation, business profile and owner
 * membership. Safe to run twice: an existing user is reused, and the membership is
 * upserted.
 *
 * The password is printed once to the terminal. Change it after the first sign-in.
 */
import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import postgres from 'postgres'

const fail = (message, code = 1) => {
  console.error(`FAIL  ${message}`)
  process.exit(code)
}

if (!existsSync('.env.local')) fail('.env.local not found', 2)
process.loadEnvFile('.env.local')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
/** Pooler first: the direct db.<ref>.supabase.co host is IPv6-only on some networks. */
const dbUrls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean)

if (!supabaseUrl || !serviceKey) fail('Supabase URL or service-role key missing', 2)
if (dbUrls.length === 0) fail('DIRECT_URL and DATABASE_URL are both empty', 2)

const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@eventsma.in').trim().toLowerCase()
const orgName = (process.env.SEED_ORG_NAME ?? 'Kannan Events').trim()
const orgSlug = (process.env.SEED_ORG_SLUG ?? 'kannan-events').trim().toLowerCase()
const password = process.env.SEED_ADMIN_PASSWORD?.trim()

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

async function findUser() {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=200`, { headers })
  if (!response.ok) fail(`could not list users (${response.status}): ${await response.text()}`)
  const body = await response.json()
  return (body.users ?? []).find((user) => user.email?.toLowerCase() === email) ?? null
}

async function createUser() {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password: password ?? `Em-${randomBytes(9).toString('base64url')}!7q`,
      email_confirm: true,
    }),
  })
  if (!response.ok) fail(`could not create user (${response.status}): ${await response.text()}`)
  return response.json()
}

async function updatePassword(userId) {
  if (!password) return
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ password, email_confirm: true }),
  })
  if (!response.ok) fail(`could not set password (${response.status}): ${await response.text()}`)
}

let user = await findUser()
let created = false
if (!user) {
  user = await createUser()
  created = true
  console.log(`1/3  auth user created  ${email}`)
} else {
  await updatePassword(user.id)
  console.log(`1/3  auth user exists   ${email} (password set to the value below)`)
}

let sql = null
let lastError = null
for (const url of dbUrls) {
  const candidate = postgres(url, {
    max: 1,
    ssl: 'require',
    prepare: false,
    connect_timeout: 15,
    onnotice: () => {},
  })
  try {
    await candidate`select 1`
    sql = candidate
    break
  } catch (error) {
    lastError = error
    await candidate.end({ timeout: 1 }).catch(() => {})
  }
}
if (!sql) fail(lastError instanceof Error ? lastError.message : String(lastError))

try {
  const [org] = await sql`
    insert into organisations (name, slug, plan, status)
    values (${orgName}, ${orgSlug}, 'trial', 'active')
    on conflict (slug) do update set name = excluded.name
    returning id, name, slug
  `

  await sql`
    insert into businesses (org_id, name, city, email, phone, published)
    values (${org.id}, ${orgName}, 'Kochi', ${email}, null, false)
    on conflict (org_id) do update set name = excluded.name, email = excluded.email
  `
  console.log(`2/3  organisation       ${org.name} (/${org.slug})`)

  await sql`
    insert into memberships (org_id, user_id, role, email, display_name, status)
    values (${org.id}, ${user.id}, 'owner', ${email}, 'Platform admin', 'active')
    on conflict (org_id, user_id) do update
      set role = 'owner', status = 'active', email = excluded.email
  `
  console.log('3/3  owner membership   ready')

  console.log('\nSuper-admin credentials (change after first sign-in)')
  console.log(`  email    ${email}`)
  if (password) console.log(`  password ${password}`)
  else console.log('  password unchanged (no SEED_ADMIN_PASSWORD given)')
  console.log(`  user     ${user.id}`)
  console.log(`  org      ${org.id}`)
  if (created) console.log('\nKeep this password out of git; it is only shown here.')
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
} finally {
  await sql.end({ timeout: 5 })
}
