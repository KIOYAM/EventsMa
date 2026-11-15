import Link from 'next/link'
import { notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { PrintButton } from '@/components/print-button'
import { Stat } from '@/components/ui/stat'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getInvoiceDetail } from '@/lib/db/money'
import {
  INVOICE_STATUS_LABEL,
  PAYMENT_MODES,
  PAYMENT_MODE_LABEL,
  type InvoiceStatus,
} from '@/lib/domain/ops'
import { shortDate } from '@/lib/utils'
import { markInvoicePaid, recordPayment, voidInvoice } from '../actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('invoices.detail.title') }
}

const ERROR_KEYS: Record<string, string> = {
  payment: 'invoices.detail.errors.payment',
  void: 'invoices.detail.errors.void',
  overpay: 'invoices.detail.errors.overpay',
  has_payments: 'invoices.detail.errors.hasPayments',
  demo: 'invoices.detail.errors.demo',
}

const TONE: Record<InvoiceStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  issued: 'gold',
  part_paid: 'accent',
  paid: 'success',
  void: 'neutral',
}

export default async function InvoiceDetailPage({
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
  const invoice = await withWorkspace(ctx, () => getInvoiceDetail(ctx.orgId, ctx.demo, id))
  if (!invoice) notFound()

  const balance = Math.max(0, invoice.amountPaise - invoice.paidPaise)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const today = new Date().toISOString().slice(0, 10)
  const paymentToken = randomUUID()
  const paidToken = randomUUID()

  const errorKey = query.error ? ERROR_KEYS[query.error] : undefined

  return (
    <div className="space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('invoices.detail.back')}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[invoice.status]}>{INVOICE_STATUS_LABEL[invoice.status]}</Badge>
            {invoice.quotationNumber ? (
              <Badge tone="outline">
                {t('invoices.detail.from')} {invoice.quotationNumber}
              </Badge>
            ) : null}
            <Badge tone="outline">{t('invoices.detail.manualPayments')}</Badge>
          </div>
          <h1 className="font-display text-2xl text-forest sm:text-3xl">{invoice.number}</h1>
          <p className="text-sm text-ink-muted">
            {invoice.eventTitle} - {invoice.clientName ?? t('invoices.detail.noClient')}
          </p>
          <p className="text-xs text-ink-muted">
            Issued {shortDate(invoice.issuedAt.slice(0, 10))}
            {invoice.dueOn ? ` - due ${shortDate(invoice.dueOn)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/events/${invoice.eventId}`}
            className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink print:hidden"
          >
            {t('invoices.detail.openEvent')}
          </Link>
          <PrintButton label={t('invoices.detail.print')} />
        </div>
      </header>

      {errorKey ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta print:hidden">
          {t(errorKey)}
        </div>
      ) : null}
      {query.saved === 'existing' ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest print:hidden">
          {t('invoices.saved.existing')}
        </div>
      ) : null}
      {query.saved === 'settled' ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest print:hidden">
          {t('invoices.saved.settled')}
        </div>
      ) : null}
      {query.saved === 'payment' ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest print:hidden">
          {t('invoices.saved.payment')}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
        <Stat
          label={t('invoices.detail.statTotal')}
          value={formatPaiseLocalised(invoice.amountPaise, locale)}
          hint={t('invoices.detail.statTotalHint')}
        />
        <Stat
          label={t('invoices.detail.statReceived')}
          value={formatPaiseLocalised(invoice.paidPaise, locale)}
          hint={t('invoices.detail.statReceivedHint')}
          tone="positive"
        />
        <Stat
          label={t('invoices.detail.statBalance')}
          value={formatPaiseLocalised(balance, locale)}
          hint={balance > 0 ? t('invoices.detail.statBalanceStill') : t('invoices.detail.statBalanceSettled')}
          tone={balance > 0 ? 'warning' : 'positive'}
        />
        <Stat
          label={t('invoices.detail.statPayments')}
          value={String(invoice.payments.length)}
          hint={t('invoices.detail.statPaymentsHint')}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.detail.docTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                  {t('invoices.detail.billedTo')}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {invoice.clientName ?? t('invoices.detail.noClient')}
                </p>
                <p className="text-xs text-ink-muted">{invoice.eventTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                  {t('invoices.detail.amount')}
                </p>
                <p className="tabular mt-1 text-xl font-semibold text-forest">
                  {formatPaiseLocalised(invoice.amountPaise, locale)}
                </p>
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t('invoices.detail.totalInvoiced')}</dt>
                <dd className="tabular text-ink">
                  {formatPaiseLocalised(invoice.amountPaise, locale)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t('invoices.detail.received')}</dt>
                <dd className="tabular text-ink">
                  {formatPaiseLocalised(invoice.paidPaise, locale)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 font-medium">
                <dt className="text-ink">{t('invoices.detail.balanceDue')}</dt>
                <dd className="tabular text-forest">
                  {formatPaiseLocalised(balance, locale)}
                </dd>
              </div>
            </dl>

            {invoice.notes ? (
              <p className="rounded-control bg-canvas px-3 py-2 text-xs leading-relaxed text-ink-muted">
                {invoice.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-5 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.detail.recordPayment')}</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.status === 'void' ? (
                <p className="text-sm text-ink-muted">{t('invoices.detail.invoiceVoid')}</p>
              ) : balance === 0 ? (
                <p className="text-sm text-ink-muted">{t('invoices.detail.invoiceSettled')}</p>
              ) : (
                <form action={recordPayment} className="space-y-3">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="paymentToken" value={paymentToken} />
                  <Field label={t('invoices.detail.amountLabel')} htmlFor="amount">
                    <Input
                      id="amount"
                      name="amount"
                      inputMode="decimal"
                      required
                      defaultValue={(balance / 100).toFixed(2)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('invoices.detail.mode')} htmlFor="mode">
                      <Select id="mode" name="mode" defaultValue="bank">
                        {PAYMENT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {PAYMENT_MODE_LABEL[mode]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={t('invoices.detail.received')} htmlFor="receivedOn">
                      <Input
                        id="receivedOn"
                        name="receivedOn"
                        type="date"
                        defaultValue={today}
                        required
                      />
                    </Field>
                  </div>
                  <Field
                    label={t('invoices.detail.reference')}
                    htmlFor="reference"
                    hint={t('invoices.detail.referenceHint')}
                  >
                    <Input
                      id="reference"
                      name="reference"
                      maxLength={120}
                      placeholder={t('invoices.detail.referencePlaceholder')}
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {t('invoices.detail.recordPaymentBtn')}
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          {invoice.status !== 'void' && balance > 0 && canEdit ? (
            <form action={markInvoicePaid}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <input type="hidden" name="paidToken" value={paidToken} />
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink hover:bg-mint-subtle"
              >
                {t('invoices.detail.markPaid')}
              </button>
              <p className="mt-1.5 text-[11px] text-ink-muted">
                {t('invoices.detail.markPaidBody', {
                  balance: formatPaiseLocalised(balance, locale),
                })}
              </p>
            </form>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.detail.payments')}</CardTitle>
              <Badge tone="outline">{invoice.payments.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.payments.length === 0 ? (
                <p className="text-xs text-ink-muted">{t('invoices.detail.noPaymentRecorded')}</p>
              ) : (
                invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="tabular text-ink">
                        {formatPaiseLocalised(payment.amountPaise, locale)}
                      </p>
                      <p className="text-ink-muted">
                        {PAYMENT_MODE_LABEL[payment.mode as keyof typeof PAYMENT_MODE_LABEL] ?? payment.mode}
                        {payment.receivedAt ? ` - ${shortDate(payment.receivedAt.slice(0, 10))}` : ''}
                      </p>
                      {payment.reference ? (
                        <p className="truncate text-[11px] text-ink-muted">{payment.reference}</p>
                      ) : null}
                    </div>
                    <Badge tone={payment.status === 'captured' ? 'success' : 'neutral'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {invoice.status !== 'void' && invoice.payments.length === 0 ? (
            <form action={voidInvoice}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button
                type="submit"
                disabled={!canEdit}
                className="text-xs text-ink-muted underline underline-offset-2 disabled:opacity-40"
              >
                {t('invoices.detail.voidInvoice')}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
