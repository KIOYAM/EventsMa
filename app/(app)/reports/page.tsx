import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { requireWorkspace } from '@/lib/auth/session'
import { getReportData } from '@/lib/db/money'
import { formatINR, formatPercentBp } from '@/lib/domain/money'

export const metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const ctx = await requireWorkspace()
  const data = await getReportData(ctx.orgId, ctx.demo)
  const peak = Math.max(1, ...data.months.map((month) => Math.max(month.revenuePaise, month.expensePaise)))
  const marginBp =
    data.revenuePaise > 0 ? Math.round((data.marginPaise * 10_000) / data.revenuePaise) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Performance"
        title="The numbers you would show a bank"
        description="Server-aggregated from captured payments and recorded expenses. No client-side totals, no chart library, no measurement timing to go wrong."
        actions={
          <div className="flex gap-2">
            <Link
              href="/api/exports?kind=ledger"
              prefetch={false}
              className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
            >
              Ledger CSV
            </Link>
            <Link
              href="/api/exports?kind=monthly"
              prefetch={false}
              className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
            >
              Monthly CSV
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={formatINR(data.revenuePaise, { compact: true })} hint="All captured payments" tone="positive" />
        <Stat label="Costs" value={formatINR(data.expensePaise, { compact: true })} hint="All recorded expenses" />
        <Stat label="Margin" value={formatINR(data.marginPaise, { compact: true })} hint={`${formatPercentBp(marginBp)} of revenue`} />
        <Stat
          label="Quote conversion"
          value={formatPercentBp(data.conversionBp)}
          hint={`${data.acceptedCount} of ${data.quoteCount} accepted`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Last six months</CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-forest" aria-hidden />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-terracotta" aria-hidden />
              Costs
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-52 items-end gap-4 overflow-x-auto pb-2">
            {data.months.map((month) => {
              const revenueHeight = Math.max(4, Math.round((month.revenuePaise / peak) * 100))
              const expenseHeight = Math.max(4, Math.round((month.expensePaise / peak) * 100))
              return (
                <div key={month.key} className="flex min-w-[44px] flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t bg-forest/85"
                      style={{ height: `${revenueHeight}%` }}
                      title={`Revenue ${formatINR(month.revenuePaise)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-terracotta/70"
                      style={{ height: `${expenseHeight}%` }}
                      title={`Costs ${formatINR(month.expensePaise)}`}
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted">{month.label}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Bars are percentages of the highest month in the window. Exact figures are in the
            monthly CSV.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where the money went</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.categories.length === 0 ? (
              <p className="text-sm text-ink-muted">No expenses recorded yet.</p>
            ) : (
              data.categories.map((category) => {
                const share =
                  data.expensePaise > 0
                    ? Math.round((category.amountPaise / data.expensePaise) * 100)
                    : 0
                return (
                  <div key={category.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink">{category.label}</span>
                      <span className="tabular text-ink-muted">
                        {formatINR(category.amountPaise)} · {share}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-forest/70" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events and quotes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Events on record</span>
              <span className="tabular text-ink">{data.eventCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Quotes issued</span>
              <span className="tabular text-ink">{data.quoteCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Accepted</span>
              <span className="tabular text-ink">{data.acceptedCount}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3">
              <span className="text-ink-muted">Conversion</span>
              <span className="tabular text-forest">{formatPercentBp(data.conversionBp)}</span>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              Conversion counts accepted quotes over every quote issued in the workspace, not just
              this month. A quote that was revised counts once.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
