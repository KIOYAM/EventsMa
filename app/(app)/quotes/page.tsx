import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getWorkspaceSummary } from '@/lib/db/queries'
import { formatPercentBp } from '@/lib/domain/money'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised } from '@/lib/i18n/format'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('quotes.title') }
}

const TONE: Record<string, 'success' | 'mint' | 'gold' | 'neutral' | 'accent'> = {
  accepted: 'success',
  sent: 'mint',
  viewed: 'gold',
  draft: 'neutral',
  declined: 'accent',
}

export default async function QuotesPage() {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const data = await withWorkspace(ctx, () => getWorkspaceSummary(ctx.orgId, ctx.demo))

  /** A status the catalogue has not seen yet keeps its stored value. */
  const statusLabel = (status: string) => {
    const key = `quotes.status.${status}`
    const translated = t(key)
    return translated === key ? status : translated
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('quotes.list.eyebrow')}
        title={t('quotes.list.title')}
        description={t('quotes.list.description')}
        actions={
          <Link
            href="/quotes/new"
            className="inline-flex h-11 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
          >
            {t('quotes.list.newQuote')}
          </Link>
        }
      />

      {data.quotes.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline bg-paper p-8 text-center">
          <p className="text-sm font-medium text-ink">{t('quotes.list.emptyTitle')}</p>
          <p className="mt-1 text-sm text-ink-muted">{t('quotes.list.emptyBody')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-hairline bg-paper">
          {data.quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-4 py-4 last:border-b-0 hover:bg-mint-subtle/60 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{quote.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {t('quotes.list.meta', {
                    number: quote.number,
                    date: formatDateLocalised(quote.eventDate, locale, 'short', 'numeric'),
                    guests: quote.guests,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="tabular text-xs text-ink-muted">
                  {t('quotes.list.margin', { percent: formatPercentBp(quote.marginBp) })}
                </span>
                <span className="tabular text-sm font-medium text-ink">
                  {formatPaiseLocalised(quote.totalPaise, locale)}
                </span>
                <Badge tone={TONE[quote.status] ?? 'neutral'}>{statusLabel(quote.status)}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
