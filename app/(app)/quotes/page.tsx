import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { requireWorkspace } from '@/lib/auth/session'
import { getWorkspaceSummary } from '@/lib/db/queries'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { shortDate } from '@/lib/utils'

export const metadata = { title: 'Quotes' }

const TONE: Record<string, 'success' | 'mint' | 'gold' | 'neutral' | 'accent'> = {
  accepted: 'success',
  sent: 'mint',
  viewed: 'gold',
  draft: 'neutral',
  declined: 'accent',
}

export default async function QuotesPage() {
  const ctx = await requireWorkspace()
  const data = await getWorkspaceSummary(ctx.orgId, ctx.demo)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Selling"
        title="Quotations"
        description="Each quotation freezes the prices used at the moment it was sent. Later catalogue edits never rewrite history."
        actions={
          <Link
            href="/quotes/new"
            className="inline-flex h-11 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
          >
            New quote
          </Link>
        }
      />

      {data.quotes.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline bg-paper p-8 text-center">
          <p className="text-sm font-medium text-ink">No quotations yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            Build the first one from your catalogue. It takes about a minute.
          </p>
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
                  {quote.number} · {shortDate(quote.eventDate)} · {quote.guests} guests
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="tabular text-xs text-ink-muted">
                  {formatPercentBp(quote.marginBp)} margin
                </span>
                <span className="tabular text-sm font-medium text-ink">
                  {formatINR(quote.totalPaise)}
                </span>
                <Badge tone={TONE[quote.status] ?? 'neutral'}>{quote.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
