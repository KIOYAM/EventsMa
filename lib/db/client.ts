import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as core from './schema'
import * as catering from './schema-catering'
import * as services from './schema-services'
import * as share from './schema-share'
import { currentScopedDb } from './workspace-context'

/** Every table shares one Drizzle instance and one query builder. */
export const schema = { ...core, ...catering, ...services, ...share }

export type EventsMaDatabase = PostgresJsDatabase<typeof schema>

const globalForDb = globalThis as unknown as {
  __eventsmaDb?: EventsMaDatabase
  __eventsmaSql?: postgres.Sql
}

/**
 * postgres-js supports `max_pipeline` at runtime, but its 3.4.x typings do not
 * declare it yet. Adding it to the option type is the honest way to use it.
 */
type PoolOptions = NonNullable<Parameters<typeof postgres>[1]> & { max_pipeline?: number }

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * One pooled client per process.
 *
 * Two settings exist for Supabase's transaction pooler (port 6543):
 * - `prepare: false` — the pooler does not support named prepared statements.
 * - `max_pipeline: 1` — postgres-js pipelines queries over a socket by default,
 *   and a transaction pooler gives each pipeline step its own server connection,
 *   so a concurrent burst (a layout and its page querying at once) waits on
 *   connections that never come back. That showed up in production as a page
 *   whose Suspense boundary never resolved; serialising costs one round trip.
 */
export function getSql(): postgres.Sql {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured. See .env.example.')
  }

  if (!globalForDb.__eventsmaSql) {
    const options: PoolOptions = {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      max_pipeline: 1,
      onnotice: () => {},
    }
    globalForDb.__eventsmaSql = postgres(url, options)
  }

  return globalForDb.__eventsmaSql
}

/**
 * Request-scoped Drizzle handle.
 *
 * Inside `withWorkspace`, the handle is bound to a transaction running as the
 * `authenticated` role with the caller's JWT claims, so RLS applies. Outside a
 * scope this throws: a query with no tenant identity must never silently run as
 * the table owner. System paths use `getSystemDb()` and say so.
 */
export function getDb(): EventsMaDatabase {
  const scoped = currentScopedDb<EventsMaDatabase>()
  if (scoped) return scoped

  throw new Error(
    'Database query ran outside a workspace scope. Wrap the read/write in withWorkspace(ctx, ...) ' +
      'or use getSystemDb() for a deliberately system-only path.',
  )
}

/**
 * Owner connection. Bypasses RLS by design, so only use it where there is no
 * member identity to assert: auth/membership lookup, onboarding, invitation
 * acceptance, public token routes, platform admin, health and sitemap.
 */
export function getSystemDb(): EventsMaDatabase {
  getSql()
  if (!globalForDb.__eventsmaDb) {
    globalForDb.__eventsmaDb = drizzle(getSql(), { schema })
  }
  return globalForDb.__eventsmaDb
}
