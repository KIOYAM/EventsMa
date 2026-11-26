/**
 * Shared plumbing for the importer: one owner connection, the tenant lookup and
 * the small normalisers every step needs.
 *
 * The connection is the direct one from `.env.local` (service role), because the
 * importer writes rows for a tenant whose owner is not signed in. Nothing here
 * prints a connection string or a secret.
 */
import postgres from 'postgres'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type Sql = ReturnType<typeof postgres>

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function connect(): Sql {
  process.loadEnvFile(resolve(ROOT, '.env.local'))
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) {
    console.error('DIRECT_URL and DATABASE_URL are both empty in .env.local')
    process.exit(2)
  }
  return postgres(url, { max: 2, ssl: 'require', prepare: false, onnotice: () => {} })
}

export interface Tenant {
  orgId: string
  businessId: string
  slug: string
  name: string
  ownerUserId: string | null
}

export async function resolveTenant(sql: Sql, slug: string): Promise<Tenant> {
  const [row] = await sql`
    select o.id as org_id, o.name, o.slug, b.id as business_id,
      (select m.user_id from memberships m where m.org_id = o.id and m.role = 'owner' order by m.created_at limit 1) as owner_user_id
    from organisations o
    join businesses b on b.org_id = o.id
    where o.slug = ${slug}
    limit 1
  `
  if (!row) throw new Error(`No business found for slug "${slug}".`)
  return {
    orgId: String(row.org_id),
    businessId: String(row.business_id),
    slug: String(row.slug),
    name: String(row.name),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
  }
}

/** E.164-ish normalisation, matching how the app de-duplicates clients. */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return `+${digits}`
}

/** A timestamptz literal for a date + IST clock time. */
export function at(date: string, time: string | null | undefined): string {
  return `${date}T${(time ?? '09:00').slice(0, 5)}:00+05:30`
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000)
}

export function daysAhead(days: number): Date {
  return new Date(Date.now() + days * 86_400_000)
}

export function dateAgo(days: number): string {
  return daysAgo(days).toISOString().slice(0, 10)
}

export function jsonOf(sql: Sql) {
  return (value: unknown) => sql.json(value as never)
}
