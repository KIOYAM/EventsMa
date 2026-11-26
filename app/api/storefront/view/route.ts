import { NextResponse } from 'next/server'
import { recordStorefrontView } from '@/lib/db/storefront-analytics'
import { parseAttribution } from '@/lib/domain/storefront-attribution'
import { clientIp, consumeRateLimit } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The public view counter.
 *
 * Deliberately always answers 204: a bot learns nothing from a valid slug, an
 * unknown one or a rate limit, and the page never waits on this. The client
 * sends one beacon per tab session; the IP limit covers a script that does not.
 */
function accepted(): NextResponse {
  return new NextResponse(null, { status: 204, headers: { 'cache-control': 'no-store' } })
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const declared = Number(request.headers.get('content-length') ?? 0)
    if (declared > 2048) return accepted()

    const body = (await request.json()) as {
      slug?: unknown
      referrer?: unknown
      query?: unknown
    }
    const slug = typeof body.slug === 'string' ? body.slug.trim().slice(0, 80) : ''
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(slug)) return accepted()

    const limit = await consumeRateLimit({
      bucket: 'storefront-view-ip',
      identifier: `${slug}:${clientIp(request)}`,
      limit: 120,
      windowSeconds: 3600,
    })
    if (!limit.allowed) return accepted()

    await recordStorefrontView({
      slug,
      attribution: parseAttribution({ referrer: body.referrer, query: body.query }),
    })
  } catch {
    // A view is not worth a 500, a retry or an alert.
  }

  return accepted()
}
