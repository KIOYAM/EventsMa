/**
 * One-command database bring-up for a fresh Supabase project.
 *
 *   node db/setup.mjs
 *
 * Reads .env.local itself so it never prints, echoes or logs a connection
 * string. Applies the Drizzle migrations, applies db/policies.sql, then runs a
 * real two-tenant isolation test inside a transaction that is rolled back.
 *
 * Exit codes: 0 = every check passed, 1 = a check failed, 2 = configuration.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import postgres from 'postgres'

const fail = (message, code = 1) => {
  console.error(`FAIL  ${message}`)
  process.exit(code)
}

if (!existsSync('.env.local')) fail('.env.local not found', 2)
process.loadEnvFile('.env.local')

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) fail('DIRECT_URL and DATABASE_URL are both empty in .env.local', 2)

const kit = 'node_modules/drizzle-kit/bin.cjs'
if (!existsSync(kit)) fail('drizzle-kit is not installed; run npm install', 2)

console.log('1/4  applying migrations')
const migration = spawnSync(process.execPath, [kit, 'migrate'], {
  stdio: 'inherit',
  env: process.env,
})
if (migration.status !== 0) fail('migration failed (see output above)')

const sql = postgres(url, {
  max: 1,
  ssl: 'require',
  prepare: false,
  connect_timeout: 15,
  onnotice: () => {},
})

try {
  console.log('2/4  applying row level security policies')
  await sql.unsafe(readFileSync('db/policies.sql', 'utf8'))

  console.log('3/4  checking coverage')
  const [{ tables }] = await sql`select count(*)::int as tables from pg_tables where schemaname = 'public'`
  const [{ rls }] = await sql`
    select count(*)::int as rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  `
  const [{ policies }] = await sql`select count(*)::int as policies from pg_policies where schemaname = 'public'`
  const unprotected = await sql`
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join information_schema.columns col
      on col.table_schema = 'public' and col.table_name = c.relname and col.column_name = 'org_id'
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  `

  console.log(`     ${tables} tables, ${rls} with RLS, ${policies} policies`)
  if (unprotected.length > 0) {
    console.error(`     tenant tables without RLS: ${unprotected.map((r) => r.relname).join(', ')}`)
    fail('every table with org_id must have row level security')
  }

  console.log('4/4  two-tenant isolation test (rolled back)')
  const [{ exists: hasAuth }] = await sql`
    select exists (select 1 from pg_roles where rolname = 'authenticated') as exists
  `
  if (!hasAuth) {
    console.log('     skipped: this database has no authenticated role (not a Supabase project)')
  } else {
    const orgA = '11111111-1111-4111-8111-111111111111'
    const orgB = '22222222-2222-4222-8222-222222222222'
    const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

    const result = await sql.begin(async (tx) => {
      await tx`savepoint isolation_test`
      await tx`
        insert into organisations (id, name, slug, plan, status)
        values (${orgA}, 'Isolation A', ${`iso-a-${Date.now()}`}, 'trial', 'active'),
               (${orgB}, 'Isolation B', ${`iso-b-${Date.now()}`}, 'trial', 'active')
      `
      await tx`
        insert into memberships (org_id, user_id, role, status, email)
        values (${orgA}, ${userA}, 'owner', 'active', 'a@isolation.test'),
               (${orgB}, ${userB}, 'owner', 'active', 'b@isolation.test')
      `
      await tx`insert into clients (org_id, name) values (${orgA}, 'Tenant A client')`
      await tx`
        insert into catering_sessions (org_id, name) values (${orgA}, 'Isolation lunch')
      `

      await tx`set local role authenticated`
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userB, role: 'authenticated' })}, true)`

      const [seen] = await tx`select count(*)::int as n from clients where org_id = ${orgA}`
      const [orgs] = await tx`select count(*)::int as n from organisations where id = ${orgA}`
      const [members] = await tx`select count(*)::int as n from memberships where org_id = ${orgA}`
      const [own] = await tx`select count(*)::int as n from organisations where id = ${orgB}`
      const [sessions] = await tx`select count(*)::int as n from catering_sessions where org_id = ${orgA}`

      await tx`rollback to savepoint isolation_test`
      return { seen: seen.n, orgs: orgs.n, members: members.n, own: own.n, sessions: sessions.n }
    })

    if (result.seen !== 0 || result.orgs !== 0 || result.members !== 0 || result.sessions !== 0) {
      fail(
        `tenant B can read tenant A (clients ${result.seen}, orgs ${result.orgs}, members ${result.members}, catering sessions ${result.sessions})`,
      )
    }
    if (result.own !== 1) fail('tenant B cannot read its own organisation')
    console.log('     PASS  tenant B sees 0 rows of tenant A and 1 of its own')
  }

  console.log('\nOK  database ready')
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
} finally {
  await sql.end({ timeout: 5 })
}
