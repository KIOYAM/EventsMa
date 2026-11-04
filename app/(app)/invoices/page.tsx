import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { Pagination } from '@/components/pagination'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getAcceptedQuoteOptions, getInvoicePage } from '@/lib/db/money'
import { formatINR } from '@/lib/domain/money'
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from '@/lib/domain/ops'
import { PAGE_SIZE, parsePage } from '@/lib/pagination'
import { shortDate } from '@/lib/utils'
import { createInvoice } from './actions'

export const metadata = { title: 'Invoices' }

const TONE: Record<InvoiceStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  issued: 'gold',
  part_paid: 'accent',
  paid: 'success',
  void: 'neutral',
}

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can raise an invoice.',
  demo: 'Demo mode: connect a database before raising an invoice.',
  quote: 'Choose an accepted quote that has not been invoiced yet.',
  missing: 'That invoice could not be found.',
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; error?: string; saved?: string; event?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const page = parsePage(params.page)
  const [data, quotes] = await Promise.all([
    getInvoicePage(ctx.orgId, ctx.demo, { status: params.status, page }),
    getAcceptedQuoteOptions(ctx.orgId, ctx.demo),
  ])
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const available = quotes.filter((quote) => !quote.alreadyInvoiced)
  const dueDefault = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Invoices and what is still owed"
        description="A quotation is a promise; an invoice is a document. Raise it from the accepted version, then record cash, UPI or bank transfers against it. Payments are append-only."
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Saved.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Outstanding" value={formatINR(data.outstandingPaise, { compact: true })} hint="Across active invoices" tone={data.outstandingPaise > 0 ? 'warning' : 'positive'} />
        <Stat label="Invoices" value={String(data.total)} hint="Issued and paid" />
        <Stat
          label="Accepted quotes"
          value={String(available.length)}
          hint="Ready to invoice"
        />
        <Stat label="Collected" value={formatINR(data.rows.reduce((sum, row) => sum + row.paidPaise, 0), { compact: true })} hint="This page" tone="positive" />
      </section>

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <Link
          href="/invoices"
          className={
            !params.status
              ? 'whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white'
              : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-muted'
          }
        >
          All
        </Link>
        {(['issued', 'part_paid', 'paid', 'void'] as const).map((status) => (
          <Link
            key={status}
            href={`/invoices?status=${status}`}
            className={
              params.status === status
                ? 'whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white'
                : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-muted'
            }
          >
            {INVOICE_STATUS_LABEL[status]}
          </Link>
        ))}
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Accept a quote first, then raise the invoice from it. The amount is taken from the frozen version, never recomputed."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-hairline bg-paper">
          {data.rows.map((row) => (
            <Link
              key={row.id}
              href={`/invoices/${row.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-4 py-3.5 last:border-b-0 hover:bg-mint-subtle/60 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {row.number} · {row.eventTitle}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {row.clientName ?? 'No client'}
                  {row.dueOn ? ` · due ${shortDate(row.dueOn)}` : ''} · issued{' '}
                  {shortDate(row.issuedAt.slice(0, 10))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="tabular text-sm text-ink">{formatINR(row.amountPaise)}</p>
                  <p className="tabular text-[11px] text-ink-muted">
                    {formatINR(row.paidPaise)} received
                  </p>
                </div>
                <Badge tone={TONE[row.status]}>{INVOICE_STATUS_LABEL[row.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        basePath="/invoices"
        page={data.page}
        total={data.total}
        pageSize={PAGE_SIZE}
        params={{ status: params.status }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Raise an invoice</CardTitle>
          <Badge tone="outline">{available.length} ready</Badge>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nothing to invoice. A quote must be accepted before it becomes a bill.
            </p>
          ) : (
            <form action={createInvoice} className="grid gap-4 md:grid-cols-2">
              <Field label="Accepted quote" htmlFor="quotationId" className="md:col-span-2">
                <Select id="quotationId" name="quotationId" required defaultValue="">
                  <option value="" disabled>
                    Choose a quote
                  </option>
                  {available.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.number} · {quote.eventTitle} · {formatINR(quote.amountPaise)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due date" htmlFor="dueOn">
                <Input id="dueOn" name="dueOn" type="date" defaultValue={dueDefault} />
              </Field>
              <Field label="Notes" htmlFor="invoiceNotes">
                <Textarea id="invoiceNotes" name="notes" className="min-h-11" placeholder="Balance before setup." />
              </Field>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="inline-flex h-11 items-center rounded-control bg-forest px-5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Raise invoice
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
