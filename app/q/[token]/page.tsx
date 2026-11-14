import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { AcceptQuoteForm } from '@/components/quote/accept-quote-form'
import { PaymentInstructions } from '@/components/quote/payment-instructions'
import { QuoteDocument } from '@/components/quote/quote-document'
import { LocaleSwitch } from '@/components/locale-switch'
import { getSystemDb, isDatabaseConfigured } from '@/lib/db/client'
import { isDemoEnvironment } from '@/lib/environment'
import { quotations } from '@/lib/db/schema'
import { demoQuoteDocument, getPublicQuoteDocument } from '@/lib/db/queries'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised } from '@/lib/i18n/format'
import { localeMeta } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return {
    title: translatorFor(locale)('quotes.public.metadataTitle'),
    robots: { index: false, follow: false },
  }
}

const ERROR_KEYS: Record<string, string> = {
  confirm: 'quotes.public.errors.confirm',
  email: 'quotes.public.errors.email',
  expired: 'quotes.public.errors.expired',
  closed: 'quotes.public.errors.closed',
  missing: 'quotes.public.errors.missing',
  demo: 'quotes.public.errors.demo',
}

/**
 * Public, token-addressed quote. No session, no margin, no internal notes.
 * The token is unguessable and expires with the quotation.
 *
 * The language comes from the same cookie as the rest of the product, so a
 * customer who reads Tamil on the share link reads Tamil here too.
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
  const locale = await getLocale()

  if (isDemoEnvironment()) {
    return <PublicView doc={demoQuoteDocument()} token={token} locale={locale} demo />
  }
  if (!isDatabaseConfigured()) notFound()

  // No member session exists on this route; the token is the access proof.
  const [row] = await getSystemDb()
    .select({ orgId: quotations.orgId, id: quotations.id, expiresAt: quotations.tokenExpiresAt })
    .from(quotations)
    .where(eq(quotations.publicToken, token))
    .limit(1)

  if (!row) notFound()

  const expired = row.expiresAt ? row.expiresAt.getTime() < Date.now() : false
  const doc = await getPublicQuoteDocument(row.orgId, row.id)
  if (!doc) notFound()

  return (
    <PublicView
      doc={doc}
      token={token}
      locale={locale}
      expired={expired}
      accepted={query.accepted === '1'}
      error={query.error}
    />
  )
}

function PublicView({
  doc,
  token,
  locale,
  expired = false,
  accepted = false,
  error,
  demo = false,
}: {
  doc: ReturnType<typeof demoQuoteDocument>
  token: string
  locale: ReturnType<typeof localeMeta>['code']
  expired?: boolean
  accepted?: boolean
  error?: string
  demo?: boolean
}) {
  const t = createTranslator(locale)
  const errorKey = error ? ERROR_KEYS[error] : undefined
  const notice = accepted ? t('quotes.public.success') : errorKey ? t(errorKey) : null
  const isError = Boolean(error)
  const alreadyAccepted = doc.status === 'accepted'
  const closed = ['declined', 'cancelled', 'expired'].includes(doc.status)
  const canAccept = !demo && !expired && !alreadyAccepted && !closed

  return (
    <main
      lang={localeMeta(locale).intl}
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg text-forest">{doc.businessName}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">{t('quotes.public.prepared')}</span>
          <LocaleSwitch locale={locale} label={t('quotes.public.language')} />
        </div>
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
          {t('quotes.public.expired')}
        </div>
      ) : null}

      {alreadyAccepted ? (
        <div className="mb-4 rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {doc.acceptedAt
            ? t('quotes.public.acceptedOn', {
                date: formatDateLocalised(doc.acceptedAt, locale, 'short', 'numeric'),
              })
            : t('quotes.detail.acceptedTitle')}
        </div>
      ) : null}

      {demo ? (
        <div className="mb-4 rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('quotes.public.demo')}
        </div>
      ) : null}

      <QuoteDocument doc={doc} locale={locale} />

      <div className="mt-5 space-y-5">
        <PaymentInstructions
          payment={doc.payment}
          reference={doc.number}
          amountLabel={formatPaiseLocalised(doc.totalPaise, locale)}
          locale={locale}
        />
        {canAccept ? <AcceptQuoteForm token={token} locale={locale} /> : null}
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        {doc.businessPhone
          ? t('quotes.public.questions', { phone: doc.businessPhone })
          : t('quotes.public.questionsNoPhone')}
      </p>
    </main>
  )
}
