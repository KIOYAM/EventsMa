export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { hasSupabaseEnv, isDemoEnvironment } from '@/lib/environment'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'

type Check = 'ok' | 'absent' | 'error'

async function databaseCheck(): Promise<Check> {
  if (!isDatabaseConfigured()) return 'absent'
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 2500)
      }),
    ])
    return 'ok'
  } catch {
    return 'error'
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Liveness and configuration probe. Never returns secrets or connection
 * strings. A configured production deployment that cannot reach Postgres is
 * unhealthy (503), not "ok".
 */
export async function GET() {
  const [database] = await Promise.all([databaseCheck()])
  const auth: Check = hasSupabaseEnv() ? 'ok' : 'absent'
  const demo = isDemoEnvironment()
  const production = process.env.NODE_ENV === 'production'

  const healthy = database === 'ok' && auth === 'ok'
  const acceptable = demo && !production
  const status = healthy || acceptable ? 'ok' : 'degraded'
  const httpStatus = healthy || acceptable ? 200 : 503

  return NextResponse.json(
    {
      status,
      app: 'eventsma',
      time: new Date().toISOString(),
      checks: {
        database,
        auth,
        mode: demo ? 'demo' : 'live',
      },
    },
    { status: httpStatus, headers: { 'Cache-Control': 'no-store' } },
  )
}
