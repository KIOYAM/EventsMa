import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type EventsMaDatabase = PostgresJsDatabase<typeof schema>

const globalForDb = globalThis as unknown as { __eventsmaDb?: EventsMaDatabase }

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
 *
 * `statement_timeout` turns any future stall into a visible error instead of a
 * request that streams forever.
 */
export function getDb(): EventsMaDatabase {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured. See .env.example.')
  }

  if (!globalForDb.__eventsmaDb) {
    const options: PoolOptions = {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      max_pipeline: 1,
      connection: { application_name: 'eventsma', statement_timeout: 15_000 },
      onnotice: () => {},
    }
    const client = postgres(url, options)
    globalForDb.__eventsmaDb = drizzle(client, { schema })
  }

  return globalForDb.__eventsmaDb
}
