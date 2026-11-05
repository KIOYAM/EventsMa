import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { AcceptQuoteForm } from '@/components/quote/accept-quote-form'
import { PaymentInstructions } from '@/components/quote/payment-instructions'
import { QuoteDocument } from '@/components/quote/quote-document'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { isDemoEnvironment } from '@/lib/environment'
import { quotations } from '@/lib/db/schema'
import { demoQuoteDocument, getQuoteDocument } from '@/lib/db/queries'
import { formatINR } from '@/lib/domain/money'

export const metadata = { title: 'Your quotation', robots: { index: false, follow: false } }

const MESSAGES: Record<string, string> = {
  confirm: 'Tick the acceptance box before continuing.',
  email: 'Check the email address, or leave it blank.',
  expired: 'This quote has expired. Ask the business for an updated version.',
  closed: 'This quote is no longer open for acceptance.',
  missing: 'That quote link is no longer valid.',
  demo: 'Demo mode: acceptance is not recorded.',
}

const SUCCESS = 'Your acceptance has been recorded. The business will confirm the next step.'

/**
 * Public, token-addressed quote. No session, no margin, no internal notes.
 * The token is unguessable and expires with the quotation.
 */
export default async function PublicQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ accepted?: string; error?: string }>
}) {
  const { token } = await params
  const query = await searchParams

  if (isDemoEnvironment()) {
    return <PublicView doc={demoQuoteDocument()} token={token} demo />
  }
  if (!isDatabaseConfigured()) notFound()

  const [row] = await getDb()
    .select({ orgId: quotations.orgId, id: quotations.id, expiresAt: quotations.tokenExpiresAt })
    .from(quotations)
    .where(eq(quotations.publicToken, token))
    .limit(1)

  if (!row) notFound()

  const expired = row.expiresAt ? row.expiresAt.getTime() < Date.now() : false
  const doc = await getQuoteDocument(row.orgId, row.id, false)
  if (!doc) notFound()

  return (
    <PublicView
      doc={doc}
      token={token}
      expired={expired}
      accepted={query.accepted === '1'}
      error={query.error}
    />
  )
}

function PublicView({
  doc,
  token,
  expired = false,
  accepted = false,
  error,
  demo = false,
}: {
  doc: ReturnType<typeof demoQuoteDocument>
  token: string
  expired?: boolean
  accepted?: boolean
  error?: string
  demo?: boolean
}) {
  const notice = accepted ? SUCCESS : error && MESSAGES[error] ? MESSAGES[error] : null
  const isError = Boolean(error)
  const alreadyAccepted = doc.status === 'accepted'
  const closed = ['declined', 'cancelled', 'expired'].includes(doc.status)
  const canAccept = !demo && !expired && !alreadyAccepted && !closed

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg text-forest">{doc.businessName}</p>
        <span className="text-xs text-ink-muted">Prepared with EventsMa</span>
      </div>

      {notice ? (
        <div
          role={isError ? 'alert' : 'status'}
          className={
            isError
              ? 'mb-4 rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta'
              : 'mb-4 rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest'
          }
        >
          {notice}
        </div>
      ) : null}

      {expired ? (
        <div className="mb-4 rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          This quotation has passed its validity date. Ask the business for an updated quote.
        </div>
      ) : null}

      {alreadyAccepted ? (
        <div className="mb-4 rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Accepted
          {doc.acceptedAt
            ? ` on ${new Date(doc.acceptedAt).toLocaleDateString('en-IN')}`
            : ''}
          . The business has this confirmation.
        </div>
      ) : null}

      {demo ? (
        <div className="mb-4 rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          Demo view. This is sample data, not a live quotation.
        </div>
      ) : null}

      <QuoteDocument doc={doc} />

      <div className="mt-5 space-y-5">
        <PaymentInstructions
          payment={doc.payment}
          reference={doc.number}
          amountLabel={formatINR(doc.totalPaise)}
        />
        {canAccept ? <AcceptQuoteForm token={token} /> : null}
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Questions about this quote? Call {doc.businessPhone ?? 'the business directly'}.
      </p>
    </main>
  )
}
