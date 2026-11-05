import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/copy-button'
import { PageHeader } from '@/components/ui/page-header'
import { MarginPanel, QuoteDocument } from '@/components/quote/quote-document'
import { ReviseButton } from '@/components/quote/revise-button'
import { requireWorkspace } from '@/lib/auth/session'
import { getQuoteDocument } from '@/lib/db/queries'
import { formatINR } from '@/lib/domain/money'
import { appUrl } from '@/lib/app-url'

export const metadata = { title: 'Quotation' }

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  expired: 'Expired',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace()
  const { id } = await params
  const doc = await getQuoteDocument(ctx.orgId, id, ctx.demo)

  if (!doc) notFound()

  const publicUrl = doc.publicToken ? `${appUrl()}/q/${doc.publicToken}` : null
  const shareText = encodeURIComponent(
    `${doc.businessName} - ${doc.title} - ${formatINR(doc.totalPaise)} - ref ${doc.number}${
      publicUrl ? ` - ${publicUrl}` : ''
    }`,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={doc.number}
        title={doc.title}
        description={`${doc.guests} guests - ${doc.eventDate}`}
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
            {publicUrl ? <CopyButton value={publicUrl} label="Copy quote link" /> : null}
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

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={doc.status === 'accepted' ? 'success' : 'outline'}>
          {STATUS_LABEL[doc.status] ?? doc.status}
        </Badge>
        {publicUrl ? (
          <span className="text-xs text-ink-muted">
            Customer link: <code className="rounded bg-canvas px-1">{publicUrl}</code>
          </span>
        ) : null}
        {doc.tokenExpiresAt ? (
          <span className="text-xs text-ink-muted">
            Valid until {new Date(doc.tokenExpiresAt).toLocaleDateString('en-IN')}
          </span>
        ) : null}
        {doc.acceptedByEmail ? (
          <span className="text-xs text-ink-muted">Accepted by {doc.acceptedByEmail}</span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <QuoteDocument doc={doc} />

        <div className="space-y-4">
          <MarginPanel
            marginPaise={doc.marginPaise}
            marginBp={doc.marginBp}
            totalPaise={doc.totalPaise}
          />

          {doc.status === 'accepted' ? (
            <div className="rounded-card border border-mint bg-mint-subtle p-5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-forest">
                Accepted
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                The customer accepted this version. Raise the invoice, then record receipts manually
                as the money arrives.
              </p>
              <Link
                href={`/invoices?quote=${doc.id}#new`}
                className="mt-3 inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
              >
                Create invoice
              </Link>
            </div>
          ) : null}

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
              Money
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Payments are recorded manually against the invoice. No gateway, card or UPI collection
              runs inside this app. Every receipt is append-only and visible in the ledger.
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-block text-xs text-forest underline underline-offset-4"
            >
              Edit payment details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
