import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { TrendChart } from '@/components/charts/trend-chart'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { formatPercentBp } from '@/lib/domain/money'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getReportData } from '@/lib/db/money'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('reports.title') }
}

export default async function ReportsPage() {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const data = await withWorkspace(ctx, () => getReportData(ctx.orgId, ctx.demo))
  const peak = Math.max(1, ...data.months.map((month) => Math.max(month.revenuePaise, month.expensePaise)))
  const marginBp =
    data.revenuePaise > 0 ? Math.round((data.marginPaise * 10_000) / data.revenuePaise) : 0
  const marginPoints = data.months.map((month) => ({
    key: month.key,
    label: month.label,
    value: month.revenuePaise - month.expensePaise,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('reports.eyebrow')}
        title={t('reports.heading')}
        description={t('reports.intro')}
        actions={
          <div className="flex gap-2">
            <Link
              href="/api/exports?kind=ledger"
              prefetch={false}
              className="btn btn-sm btn-outline"
            >
              {t('reports.ledgerCsv')}
            </Link>
            <Link
              href="/api/exports?kind=monthly"
              prefetch={false}
              className="btn btn-sm btn-outline"
            >
              {t('reports.monthlyCsv')}
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t('reports.stats.revenue')}
          value={formatPaiseLocalised(data.revenuePaise, locale)}
          hint={t('reports.stats.revenueHint')}
          tone="positive"
        />
        <Stat
          label={t('reports.stats.costs')}
          value={formatPaiseLocalised(data.expensePaise, locale)}
          hint={t('reports.stats.costsHint')}
        />
        <Stat
          label={t('reports.stats.margin')}
          value={formatPaiseLocalised(data.marginPaise, locale)}
          hint={t('reports.stats.marginHint', { percent: formatPercentBp(marginBp) })}
        />
        <Stat
          label={t('reports.stats.conversion')}
          value={formatPercentBp(data.conversionBp)}
          hint={t('reports.stats.conversionHint', { accepted: data.acceptedCount, quotes: data.quoteCount })}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.lastSixMonths')}</CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-forest" aria-hidden />
              {t('reports.revenue')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-terracotta" aria-hidden />
              {t('reports.costs')}
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
                      title={`Revenue ${formatPaiseLocalised(month.revenuePaise, locale)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-terracotta/70"
                      style={{ height: `${expenseHeight}%` }}
                      title={`Costs ${formatPaiseLocalised(month.expensePaise, locale)}`}
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted">{month.label}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {t('reports.barsNote')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.marginTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            id="margin"
            points={marginPoints}
            tone="forest"
            formatValue={(value) => formatPaiseLocalised(value, locale)}
            ariaLabel={t('reports.marginTrendAria', {
              series: marginPoints
                .map((point) => `${point.label} ${formatPaiseLocalised(point.value, locale)}`)
                .join(', '),
            })}
            caption={t('reports.marginTrendHint')}
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.whereMoneyWent')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.categories.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('reports.noExpenses')}</p>
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
                        {t('reports.share', {
                          amount: formatPaiseLocalised(category.amountPaise, locale),
                          percent: share,
                        })}
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
            <CardTitle>{t('reports.eventsAndQuotes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">{t('reports.eventsOnRecord')}</span>
              <span className="tabular text-ink">{data.eventCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">{t('reports.quotesIssued')}</span>
              <span className="tabular text-ink">{data.quoteCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">{t('reports.accepted')}</span>
              <span className="tabular text-ink">{data.acceptedCount}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3">
              <span className="text-ink-muted">{t('reports.conversionLabel')}</span>
              <span className="tabular text-forest">{formatPercentBp(data.conversionBp)}</span>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              {t('reports.conversionNote')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
