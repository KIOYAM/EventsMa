import { NextResponse, type NextRequest } from 'next/server'
import { requireWorkspace } from '@/lib/auth/session'
import { getFullLedger, getReportData, ledgerCsv } from '@/lib/db/money'

export const dynamic = 'force-dynamic'

function csvResponse(filename: string, body: string): NextResponse {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireWorkspace()
  const kind = request.nextUrl.searchParams.get('kind') ?? 'ledger'
  const stamp = new Date().toISOString().slice(0, 10)

  if (kind === 'monthly') {
    const report = await getReportData(ctx.orgId, ctx.demo)
    const lines = [
      'month,revenue_inr,cost_inr,margin_inr',
      ...report.months.map((month) =>
        [
          month.key,
          (month.revenuePaise / 100).toFixed(2),
          (month.expensePaise / 100).toFixed(2),
          ((month.revenuePaise - month.expensePaise) / 100).toFixed(2),
        ].join(','),
      ),
      [
        'total',
        (report.revenuePaise / 100).toFixed(2),
        (report.expensePaise / 100).toFixed(2),
        (report.marginPaise / 100).toFixed(2),
      ].join(','),
    ]
    return csvResponse(`eventsma-monthly-${stamp}.csv`, lines.join('\n'))
  }

  const rows = await getFullLedger(ctx.orgId, ctx.demo)
  return csvResponse(`eventsma-ledger-${stamp}.csv`, ledgerCsv(rows))
}
