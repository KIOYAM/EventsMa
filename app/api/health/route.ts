export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { hasSupabaseEnv } from '@/lib/auth/session'

/**
 * Liveness and configuration probe. Never returns secrets or connection strings.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      app: 'eventsma',
      time: new Date().toISOString(),
      checks: {
        database: isDatabaseConfigured() ? 'configured' : 'absent',
        auth: hasSupabaseEnv() ? 'configured' : 'absent',
        pdf: 'available',
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
