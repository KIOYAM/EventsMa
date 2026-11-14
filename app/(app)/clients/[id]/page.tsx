import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { eventStatusKey } from '@/lib/i18n/ops-copy'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getClientDetail } from '@/lib/db/crm'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from '@/lib/domain/ops'
import { shortDate } from '@/lib/utils'
import { updateClient } from '../actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('clients.detail.title') }
}

const ERROR_KEYS: Record<string, string> = {
  name: 'clients.errors.name',
  email: 'clients.errors.email',
  phone: 'clients.errors.phone',
  missing: 'clients.errors.missing',
  permission: 'clients.errors.permission',
  demo: 'clients.errors.demo',
}

const INVOICE_TONE: Record<InvoiceStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  issued: 'gold',
  part_paid: 'accent',
  paid: 'success',
  void: 'neutral',
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const { id } = await params
  const query = await searchParams
  const client = await withWorkspace(ctx, () => getClientDetail(ctx.orgId, ctx.demo, id))
  if (!client) notFound()

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const quoteValue = client.quotes.reduce((sum, quote) => sum + quote.totalPaise, 0)
  const outstanding = client.invoices.reduce(
    (sum, invoice) =>
      invoice.status === 'void' ? sum : sum + Math.max(0, invoice.amountPaise - invoice.paidPaise),
    0,
  )

  const errorKey = query.error ? ERROR_KEYS[query.error] : undefined

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('clients.detail.back')}
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{client.source ?? 'manual'}</Badge>
            <span className="text-xs text-ink-muted">
              {t('clients.detail.clientSince')} {shortDate(client.createdAt.slice(0, 10))}
            </span>
          </div>
          <h1 className="font-display text-2xl leading-tight text-forest sm:text-3xl">{client.name}</h1>
          <p className="text-sm text-ink-muted">
            {client.phone ?? t('clients.noPhone')}
            {client.email ? ` - ${client.email}` : ''}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
        >
          {t('clients.detail.quoteThisClient')}
        </Link>
      </header>

      {errorKey ? (
        <div role="alert" className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}
      {query.saved ? (
        <div role="status" className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('clients.detail.saved')}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('clients.detail.statEnquiries')} value={String(client.enquiries)} hint="All time" />
        <Stat label={t('clients.detail.statEvents')} value={String(client.events)} hint="Delivered and upcoming" />
        <Stat label={t('clients.detail.statQuoted')} value={formatPaiseLocalised(quoteValue, locale)} hint="Latest versions" />
        <Stat
          label={t('clients.detail.statOutstanding')}
          value={formatPaiseLocalised(outstanding, locale)}
          hint="Across open invoices"
          tone={outstanding > 0 ? 'warning' : 'positive'}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t('clients.detail.cardEvents')}</CardTitle>
              <Badge tone="outline">{client.events.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.events.length === 0 ? (
                <p className="text-xs text-ink-muted">{t('clients.detail.noEventYet')}</p>
              ) : (
                client.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2 text-sm hover:bg-canvas"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{event.title}</span>
                      <span className="text-xs text-ink-muted">
                        {shortDate(event.eventDate)} - {event.guests} guests
                        {event.venueName ? ` - ${event.venueName}` : ''}
                      </span>
                    </span>
                    <Badge tone="outline">{t(eventStatusKey(event.status))}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('clients.detail.cardEnquiries')}</CardTitle>
              <Badge tone="outline">{client.enquiries.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.enquiries.length === 0 ? (
                <p className="text-xs text-ink-muted">{t('clients.detail.noEnquiryRecorded')}</p>
              ) : (
                client.enquiries.map((enquiry) => (
                  <div key={enquiry.id} className="rounded-control border border-hairline px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{enquiry.eventType ?? t('clients.detail.enquiry')}</span>
                      <Badge tone="outline">{t(`clients.enquiryStatus.${enquiry.status}`)}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {enquiry.eventDate ? shortDate(enquiry.eventDate) : t('clients.detail.dateToConfirm')} -{' '}
                      {enquiry.guests} guests - {shortDate(enquiry.createdAt.slice(0, 10))}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('clients.detail.cardQuotations')}</CardTitle>
              <Badge tone="outline">{client.quotes.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.quotes.length === 0 ? (
                <p className="text-xs text-ink-muted">{t('clients.detail.noQuotationYet')}</p>
              ) : (
                client.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2 text-sm hover:bg-canvas"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{quote.number}</span>
                      <span className="text-xs text-ink-muted">
                        {quote.eventDate ? shortDate(quote.eventDate) : t('clients.detail.noDate')} - {quote.status}
                      </span>
                    </span>
                    <span className="tabular text-sm text-ink">
                      {formatPaiseLocalised(quote.totalPaise, locale)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('clients.detail.cardInvoices')}</CardTitle>
              <Badge tone="outline">{client.invoices.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.invoices.length === 0 ? (
                <p className="text-xs text-ink-muted">{t('clients.detail.noInvoiceYet')}</p>
              ) : (
                client.invoices.map((invoice) => {
                  const balance = Math.max(0, invoice.amountPaise - invoice.paidPaise)
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2 text-sm hover:bg-canvas"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-ink">{invoice.number}</span>
                        <span className="text-xs text-ink-muted">
                          {invoice.dueOn ? `${t('clients.detail.due')} ${shortDate(invoice.dueOn)}` : t('clients.detail.noDueDate')} -{' '}
                          {formatPaiseLocalised(balance, locale)} balance
                        </span>
                      </span>
                      <Badge tone={INVOICE_TONE[invoice.status]}>
                        {INVOICE_STATUS_LABEL[invoice.status]}
                      </Badge>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('clients.detail.cardContactDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <form action={updateClient} className="space-y-3">
                <input type="hidden" name="id" value={client.id} />
                <Field label={t('clients.detail.fieldName')} htmlFor="clientName">
                  <Input id="clientName" name="name" defaultValue={client.name} required maxLength={120} />
                </Field>
                <Field label={t('clients.detail.fieldPhone')} htmlFor="clientPhone" hint={t('clients.detail.hintPhone')}>
                  <Input id="clientPhone" name="phone" defaultValue={client.phone ?? ''} maxLength={24} inputMode="tel" />
                </Field>
                <Field label={t('clients.detail.fieldEmail')} htmlFor="clientEmail">
                  <Input id="clientEmail" name="email" type="email" defaultValue={client.email ?? ''} maxLength={200} />
                </Field>
                <Field label={t('clients.detail.fieldSource')} htmlFor="clientSource">
                  <Input id="clientSource" name="source" defaultValue={client.source ?? ''} maxLength={60} />
                </Field>
                <Field label={t('clients.detail.fieldNotes')} htmlFor="clientNotes">
                  <Textarea id="clientNotes" name="notes" defaultValue={client.notes ?? ''} maxLength={2000} />
                </Field>
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
                >
                  {t('clients.detail.saveDetails')}
                </button>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-ink">{client.name}</p>
                <p className="text-ink-muted">{client.phone ?? t('clients.noPhone')}</p>
                <p className="text-ink-muted">{client.email ?? t('clients.noEmail')}</p>
                {client.notes ? <p className="text-xs leading-relaxed text-ink-muted">{client.notes}</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {client.events.length === 0 && client.enquiries.length === 0 ? (
        <EmptyState
          title={t('clients.detail.nothingLinkedTitle')}
          description={t('clients.detail.nothingLinkedBody')}
        />
      ) : null}
    </div>
  )
}
