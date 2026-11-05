import Link from 'next/link'
import { notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { PrintButton } from '@/components/print-button'
import { Stat } from '@/components/ui/stat'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getInvoiceDetail } from '@/lib/db/money'
import { formatINR } from '@/lib/domain/money'
import {
  INVOICE_STATUS_LABEL,
  PAYMENT_MODES,
  PAYMENT_MODE_LABEL,
  type InvoiceStatus,
} from '@/lib/domain/ops'
import { shortDate } from '@/lib/utils'
import { markInvoicePaid, recordPayment, voidInvoice } from '../actions'

export const metadata = { title: 'Invoice' }

const TONE: Record<InvoiceStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  issued: 'gold',
  part_paid: 'accent',
  paid: 'success',
  void: 'neutral',
}

const ERROR_COPY: Record<string, string> = {
  payment: 'Enter a positive amount and a valid received date.',
  void: 'A void invoice cannot take a payment.',
  overpay: 'That amount is more than the balance. Record the balance or a smaller part payment.',
  has_payments: 'Reverse the captured payments before voiding this invoice.',
  demo: 'Demo mode: connect a database before recording a payment.',
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const { id } = await params
  const query = await searchParams
  const invoice = await getInvoiceDetail(ctx.orgId, ctx.demo, id)
  if (!invoice) notFound()

  const balance = Math.max(0, invoice.amountPaise - invoice.paidPaise)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const today = new Date().toISOString().slice(0, 10)
  const paymentToken = randomUUID()
  const paidToken = randomUUID()

  return (
    <div className="space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All invoices
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[invoice.status]}>{INVOICE_STATUS_LABEL[invoice.status]}</Badge>
            {invoice.quotationNumber ? (
              <Badge tone="outline">From {invoice.quotationNumber}</Badge>
            ) : null}
            <Badge tone="outline">Manual payments</Badge>
          </div>
          <h1 className="font-display text-2xl text-forest sm:text-3xl">{invoice.number}</h1>
          <p className="text-sm text-ink-muted">
            {invoice.eventTitle} - {invoice.clientName ?? 'No client'}
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
            Open event
          </Link>
          <PrintButton label="Print invoice" />
        </div>
      </header>

      {query.error && ERROR_COPY[query.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta print:hidden">
          {ERROR_COPY[query.error]}
        </div>
      ) : null}
      {query.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest print:hidden">
          {query.saved === 'existing'
            ? 'This quotation already has an invoice. Opened it instead of creating a duplicate.'
            : query.saved === 'settled'
              ? 'This invoice is already settled.'
              : 'Saved.'}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
        <Stat label="Invoice total" value={formatINR(invoice.amountPaise)} hint="Frozen from the quote" />
        <Stat label="Received" value={formatINR(invoice.paidPaise)} hint="Manually captured receipts" tone="positive" />
        <Stat label="Balance" value={formatINR(balance)} hint={balance > 0 ? 'Still to collect' : 'Settled'} tone={balance > 0 ? 'warning' : 'positive'} />
        <Stat label="Payments" value={String(invoice.payments.length)} hint="Append-only entries" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Invoice document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Billed to</p>
                <p className="mt-1 text-sm font-medium text-ink">{invoice.clientName ?? 'No client'}</p>
                <p className="text-xs text-ink-muted">{invoice.eventTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Amount</p>
                <p className="tabular mt-1 text-xl font-semibold text-forest">
                  {formatINR(invoice.amountPaise)}
                </p>
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Total invoiced</dt>
                <dd className="tabular text-ink">{formatINR(invoice.amountPaise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Received</dt>
                <dd className="tabular text-ink">{formatINR(invoice.paidPaise)}</dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 font-medium">
                <dt className="text-ink">Balance due</dt>
                <dd className="tabular text-forest">{formatINR(balance)}</dd>
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
              <CardTitle>Record a payment</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.status === 'void' ? (
                <p className="text-sm text-ink-muted">This invoice is void.</p>
              ) : balance === 0 ? (
                <p className="text-sm text-ink-muted">
                  This invoice is settled. There is no balance to record.
                </p>
              ) : (
                <form action={recordPayment} className="space-y-3">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="paymentToken" value={paymentToken} />
                  <Field label="Amount (₹)" htmlFor="amount">
                    <Input
                      id="amount"
                      name="amount"
                      inputMode="decimal"
                      required
                      defaultValue={(balance / 100).toFixed(2)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Mode" htmlFor="mode">
                      <Select id="mode" name="mode" defaultValue="bank">
                        {PAYMENT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {PAYMENT_MODE_LABEL[mode]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Received" htmlFor="receivedOn">
                      <Input id="receivedOn" name="receivedOn" type="date" defaultValue={today} required />
                    </Field>
                  </div>
                  <Field
                    label="Reference"
                    htmlFor="reference"
                    hint="UPI reference, cheque number or receipt book entry."
                  >
                    <Input id="reference" name="reference" maxLength={120} placeholder="Optional" />
                  </Field>
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Record payment
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
                Mark balance paid in full
              </button>
              <p className="mt-1.5 text-[11px] text-ink-muted">
                Creates a manual receipt for {formatINR(balance)}. Use the form above for a part
                payment or a different mode.
              </p>
            </form>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <Badge tone="outline">{invoice.payments.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.payments.length === 0 ? (
                <p className="text-xs text-ink-muted">No payment recorded yet.</p>
              ) : (
                invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="tabular text-ink">{formatINR(payment.amountPaise)}</p>
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
                Void this invoice
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
