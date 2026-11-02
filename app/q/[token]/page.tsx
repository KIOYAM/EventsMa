import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { QuoteDocument } from '@/components/quote/quote-document'
import { UpiPayCard } from '@/components/quote/upi-pay'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { quotations } from '@/lib/db/schema'
import { demoQuoteDocument, getQuoteDocument } from '@/lib/db/queries'

export const metadata = { title: 'Your quotation', robots: { index: false, follow: false } }

/**
 * Public, token-addressed quote. No session, no margin, no internal notes.
 * The token is unguessable and expires with the quotation.
 */
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (!isDatabaseConfigured()) {
    return <PublicView doc={demoQuoteDocument()} demo />
  }

  const [row] = await getDb()
    .select({ orgId: quotations.orgId, id: quotations.id, expiresAt: quotations.tokenExpiresAt })
    .from(quotations)
    .where(eq(quotations.publicToken, token))
    .limit(1)

  if (!row) notFound()

  const expired = row.expiresAt ? row.expiresAt.getTime() < Date.now() : false
  const doc = await getQuoteDocument(row.orgId, row.id, false)
  if (!doc) notFound()

  return <PublicView doc={doc} expired={expired} />
}

function PublicView({
  doc,
  expired = false,
  demo = false,
}: {
  doc: ReturnType<typeof demoQuoteDocument>
  expired?: boolean
  demo?: boolean
}) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg text-forest">{doc.businessName}</p>
        <span className="text-xs text-ink-muted">Prepared with EventsMa</span>
      </div>

      {expired ? (
        <div className="mb-4 rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          This quotation has passed its validity date. Ask the business for an updated quote.
        </div>
      ) : null}

      {demo ? (
        <div className="mb-4 rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          Demo view. This is sample data, not a live quotation.
        </div>
      ) : null}

      <QuoteDocument doc={doc} />

      <div className="mt-5">
        <UpiPayCard
          amountPaise={doc.totalPaise}
          payeeName={doc.businessName}
          reference={doc.number}
        />
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Questions about this quote? Call {doc.businessPhone ?? 'the business directly'}.
      </p>
    </main>
  )
}
