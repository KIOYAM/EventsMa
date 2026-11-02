import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type EventsMaDatabase = PostgresJsDatabase<typeof schema>

const globalForDb = globalThis as unknown as { __eventsmaDb?: EventsMaDatabase }

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * One pooled client per process. `prepare: false` is required because Supabase's
 * transaction pooler does not support named prepared statements.
 */
export function getDb(): EventsMaDatabase {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured. See .env.example.')
  }

  if (!globalForDb.__eventsmaDb) {
    const client = postgres(url, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => {},
    })
    globalForDb.__eventsmaDb = drizzle(client, { schema })
  }

  return globalForDb.__eventsmaDb
}
