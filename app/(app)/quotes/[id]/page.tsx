import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { MarginPanel, QuoteDocument } from '@/components/quote/quote-document'
import { ReviseButton } from '@/components/quote/revise-button'
import { requireWorkspace } from '@/lib/auth/session'
import { getQuoteDocument } from '@/lib/db/queries'
import { formatINR } from '@/lib/domain/money'

export const metadata = { title: 'Quotation' }

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace()
  const { id } = await params
  const doc = await getQuoteDocument(ctx.orgId, id, ctx.demo)

  if (!doc) notFound()

  const shareText = encodeURIComponent(
    `${doc.businessName} · ${doc.title} · ${formatINR(doc.totalPaise)} · ref ${doc.number}`,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={doc.number}
        title={doc.title}
        description={`${doc.guests} guests · ${doc.eventDate}`}
        actions={
          <>
            <Link
              href="/quotes"
              className="inline-flex h-11 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
            >
              All quotes
            </Link>
            <a
              href={`/api/quotes/${id}/pdf`}
              className="inline-flex h-11 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
            >
              PDF
            </a>
            <ReviseButton quotationId={id} />
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-11 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
            >
              Share on WhatsApp
            </a>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <QuoteDocument doc={doc} />

        <div className="space-y-4">
          <MarginPanel
            marginPaise={doc.marginPaise}
            marginBp={doc.marginBp}
            totalPaise={doc.totalPaise}
          />

          <div className="rounded-card border border-hairline bg-paper p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
              Versioning
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              &ldquo;New revision&rdquo; copies this version into the next number. The version you
              already sent is never edited, so a customer holding the old link still sees exactly
              what they received.
            </p>
          </div>

          <div className="rounded-card border border-hairline bg-paper p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
              Payment
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              UPI collection is available on the customer link when{' '}
              <code className="rounded bg-canvas px-1">BUSINESS_UPI_VPA</code> is set. Razorpay
              webhooks are verified and written append-only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
