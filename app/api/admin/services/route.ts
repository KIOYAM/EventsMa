import { NextRequest, NextResponse } from 'next/server'
import { getPlatformOrgs, getServiceAdoption, getServiceQuotes, getNotifications } from '@/lib/db/admin'
import { requireWorkspace } from '@/lib/auth/session'

function platformAdmins(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { section } = await params

  const ctx = await requireWorkspace()
  const allowed =
    ctx.demo || platformAdmins().includes((ctx.email ?? '').toLowerCase())

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const demo = ctx.demo

  try {
    if (section === 'orgs') {
      const orgs = await getPlatformOrgs(demo)
      return NextResponse.json({ orgs })
    }

    if (section === 'services') {
      const adoption = await getServiceAdoption(demo)
      const quotes = await getServiceQuotes(demo)
      return NextResponse.json({ adoption, quotes })
    }

    if (section === 'notifications') {
      const notifications = await getNotifications(demo)
      return NextResponse.json({ notifications })
    }

    return NextResponse.json({ error: 'Unknown section' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
