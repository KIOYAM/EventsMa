import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTranslator } from '@/lib/i18n'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'
import type { EventDetail } from '@/lib/domain/ops'

/** Quotes raised on the event and the settlement against them. */
export function MoneyTab({
  event,
  quoteTotal,
  balance,
  locale,
}: {
  event: EventDetail
  quoteTotal: number
  balance: number
  locale: Locale
}) {
  const t = createTranslator(locale)
  const money = (paise: number) => formatPaiseLocalised(paise, locale)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.quotesOnEvent')}</CardTitle>
          <Badge tone="outline">{event.quotes.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {event.quotes.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('events.detail.noQuote')}</p>
          ) : (
            event.quotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2.5 text-sm hover:bg-mint-subtle/60"
              >
                <span className="text-ink">{quote.number}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular text-xs text-ink">{money(quote.totalPaise)}</span>
                  <Badge tone="outline">{quote.status}</Badge>
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.settlement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">{t('events.detail.quoted')}</span>
            <span className="tabular text-ink">{money(quoteTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">{t('events.detail.received')}</span>
            <span className="tabular text-positive">{money(event.paidPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">{t('events.detail.costs')}</span>
            <span className="tabular text-ink">{money(event.expensesPaise)}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-3 font-medium">
            <span className="text-ink">{t('events.detail.balanceToCollect')}</span>
            <span className="tabular text-forest">{money(balance)}</span>
          </div>
          <Link
            href={`/invoices?event=${event.id}`}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
          >
            {t('events.detail.raiseInvoice')}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
