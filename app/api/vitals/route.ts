import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_LCP_MS = 60_000
const MAX_CLS = 10

/**
 * Field vitals land in the platform log as one JSON line per page visit.
 * Values are bounded and the path is truncated, so a hostile client cannot
 * turn the log into a storage bill or leak a query string.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as {
    path?: unknown
    lcp?: unknown
    cls?: unknown
  } | null

  if (!body) return new NextResponse(null, { status: 204 })

  const lcp = Number(body.lcp)
  const cls = Number(body.cls)
  if (!Number.isFinite(lcp) || !Number.isFinite(cls)) {
    return new NextResponse(null, { status: 204 })
  }
  if (lcp < 0 || lcp > MAX_LCP_MS || cls < 0 || cls > MAX_CLS) {
    return new NextResponse(null, { status: 204 })
  }

  const path =
    typeof body.path === 'string' ? (body.path.split('?')[0] ?? '').slice(0, 120) : ''

  console.info(
    JSON.stringify({
      kind: 'web-vital',
      path,
      lcp: Math.round(lcp),
      cls: Math.round(cls * 1000) / 1000,
    }),
  )

  return new NextResponse(null, { status: 204 })
}
