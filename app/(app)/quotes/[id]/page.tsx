import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/copy-button'
import { PageHeader } from '@/components/ui/page-header'
import { MarginPanel, QuoteDocument } from '@/components/quote/quote-document'
import { ReviseButton } from '@/components/quote/revise-button'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getQuoteDocument } from '@/lib/db/queries'
import { appUrl } from '@/lib/app-url'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised } from '@/lib/i18n/format'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('quotes.document.label') }
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const { id } = await params
  const doc = await withWorkspace(ctx, () => getQuoteDocument(ctx.orgId, id, ctx.demo))

  if (!doc) notFound()

  const money = (paise: number) => formatPaiseLocalised(paise, locale)
  const publicUrl = doc.publicToken ? `${appUrl()}/q/${doc.publicToken}` : null
  const shareText = encodeURIComponent(
    `${doc.businessName} - ${doc.title} - ${money(doc.totalPaise)} - ref ${doc.number}${
      publicUrl ? ` - ${publicUrl}` : ''
    }`,
  )

  /** A status the catalogue has not seen yet keeps its stored value. */
  const statusKey = `quotes.status.${doc.status}`
  const statusLabel = t(statusKey) === statusKey ? doc.status : t(statusKey)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={doc.number}
        title={doc.title}
        description={t('quotes.detail.meta', {
          guests: doc.guests,
          date: formatDateLocalised(doc.eventDate, locale, 'short', 'numeric'),
        })}
        actions={
          <>
            <Link
              href="/quotes"
              className="btn btn-md btn-outline"
            >
              {t('quotes.detail.all')}
            </Link>
            <a
              href={`/api/quotes/${id}/pdf?lang=${locale}`}
              className="btn btn-md btn-outline"
            >
              {t('quotes.detail.pdf')}
            </a>
            <ReviseButton quotationId={id} locale={locale} />
            {publicUrl ? <CopyButton value={publicUrl} label={t('quotes.detail.copyLink')} /> : null}
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-md btn-primary"
            >
              {t('quotes.detail.whatsapp')}
            </a>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={doc.status === 'accepted' ? 'success' : 'outline'}>{statusLabel}</Badge>
        {publicUrl ? (
          <span className="text-xs text-ink-muted">
            {t('quotes.detail.customerLink')}{' '}
            <code className="rounded bg-canvas px-1">{publicUrl}</code>
          </span>
        ) : null}
        {doc.tokenExpiresAt ? (
          <span className="text-xs text-ink-muted">
            {t('quotes.detail.validUntil', {
              date: formatDateLocalised(doc.tokenExpiresAt, locale, 'short', 'numeric'),
            })}
          </span>
        ) : null}
        {doc.acceptedByEmail ? (
          <span className="text-xs text-ink-muted">
            {t('quotes.detail.acceptedBy', { email: doc.acceptedByEmail })}
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <QuoteDocument doc={doc} locale={locale} />

        <div className="space-y-4">
          <MarginPanel
            marginPaise={doc.marginPaise}
            marginBp={doc.marginBp}
            totalPaise={doc.totalPaise}
            locale={locale}
          />

          {doc.status === 'accepted' ? (
            <div className="rounded-card border border-mint bg-mint-subtle p-5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-forest">
                {t('quotes.detail.acceptedTitle')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t('quotes.detail.acceptedBody')}
              </p>
              <Link
                href={`/invoices?quote=${doc.id}#new`}
                className="mt-3 btn btn-sm btn-primary"
              >
                {t('quotes.detail.createInvoice')}
              </Link>
            </div>
          ) : null}

          <div className="card-surface p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
              {t('quotes.detail.versioningTitle')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {t('quotes.detail.versioningBody')}
            </p>
          </div>

          <div className="card-surface p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
              {t('quotes.detail.moneyTitle')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {t('quotes.detail.moneyBody')}
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-block text-xs text-forest underline underline-offset-4"
            >
              {t('quotes.detail.editPayment')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
