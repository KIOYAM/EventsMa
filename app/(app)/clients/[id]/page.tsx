import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getClientDetail } from '@/lib/db/crm'
import { formatINR } from '@/lib/domain/money'
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from '@/lib/domain/ops'
import { shortDate } from '@/lib/utils'
import { updateClient } from '../actions'

export const metadata = { title: 'Client' }

const ERROR_COPY: Record<string, string> = {
  name: 'A client needs a name.',
  email: 'Check the email address.',
  phone: 'Another client already uses that phone number.',
  missing: 'That client could not be saved.',
  permission: 'Only an owner or manager can edit clients.',
  demo: 'Demo mode: connect a database before editing.',
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
  const { id } = await params
  const query = await searchParams
  const client = await getClientDetail(ctx.orgId, ctx.demo, id)
  if (!client) notFound()

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const quoteValue = client.quotes.reduce((sum, quote) => sum + quote.totalPaise, 0)
  const outstanding = client.invoices.reduce(
    (sum, invoice) =>
      invoice.status === 'void' ? sum : sum + Math.max(0, invoice.amountPaise - invoice.paidPaise),
    0,
  )

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All clients
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{client.source ?? 'manual'}</Badge>
            <span className="text-xs text-ink-muted">Client since {shortDate(client.createdAt.slice(0, 10))}</span>
          </div>
          <h1 className="font-display text-2xl leading-tight text-forest sm:text-3xl">{client.name}</h1>
          <p className="text-sm text-ink-muted">
            {client.phone ?? 'No phone'}
            {client.email ? ` - ${client.email}` : ''}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
        >
          Quote this client
        </Link>
      </header>

      {query.error && ERROR_COPY[query.error] ? (
        <div role="alert" className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[query.error]}
        </div>
      ) : null}
      {query.saved ? (
        <div role="status" className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Client details saved.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Enquiries" value={String(client.enquiries)} hint="All time" />
        <Stat label="Events" value={String(client.events)} hint="Delivered and upcoming" />
        <Stat label="Quoted" value={formatINR(quoteValue)} hint="Latest versions" />
        <Stat
          label="Outstanding"
          value={formatINR(outstanding)}
          hint="Across open invoices"
          tone={outstanding > 0 ? 'warning' : 'positive'}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <Badge tone="outline">{client.events.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.events.length === 0 ? (
                <p className="text-xs text-ink-muted">No event yet.</p>
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
                    <Badge tone="outline">{event.status}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enquiries</CardTitle>
              <Badge tone="outline">{client.enquiries.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.enquiries.length === 0 ? (
                <p className="text-xs text-ink-muted">No enquiry recorded.</p>
              ) : (
                client.enquiries.map((enquiry) => (
                  <div key={enquiry.id} className="rounded-control border border-hairline px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{enquiry.eventType ?? 'Enquiry'}</span>
                      <Badge tone="outline">{enquiry.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {enquiry.eventDate ? shortDate(enquiry.eventDate) : 'Date to confirm'} -{' '}
                      {enquiry.guests} guests - {shortDate(enquiry.createdAt.slice(0, 10))}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotations</CardTitle>
              <Badge tone="outline">{client.quotes.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.quotes.length === 0 ? (
                <p className="text-xs text-ink-muted">No quotation yet.</p>
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
                        {quote.eventDate ? shortDate(quote.eventDate) : 'No date'} - {quote.status}
                      </span>
                    </span>
                    <span className="tabular text-sm text-ink">{formatINR(quote.totalPaise)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <Badge tone="outline">{client.invoices.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.invoices.length === 0 ? (
                <p className="text-xs text-ink-muted">No invoice yet.</p>
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
                          {invoice.dueOn ? `Due ${shortDate(invoice.dueOn)}` : 'No due date'} -{' '}
                          {formatINR(balance)} balance
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
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <form action={updateClient} className="space-y-3">
                <input type="hidden" name="id" value={client.id} />
                <Field label="Name" htmlFor="clientName">
                  <Input id="clientName" name="name" defaultValue={client.name} required maxLength={120} />
                </Field>
                <Field label="Phone" htmlFor="clientPhone" hint="The last 10 digits are the dedupe key.">
                  <Input id="clientPhone" name="phone" defaultValue={client.phone ?? ''} maxLength={24} inputMode="tel" />
                </Field>
                <Field label="Email" htmlFor="clientEmail">
                  <Input id="clientEmail" name="email" type="email" defaultValue={client.email ?? ''} maxLength={200} />
                </Field>
                <Field label="Source" htmlFor="clientSource">
                  <Input id="clientSource" name="source" defaultValue={client.source ?? ''} maxLength={60} />
                </Field>
                <Field label="Notes" htmlFor="clientNotes">
                  <Textarea id="clientNotes" name="notes" defaultValue={client.notes ?? ''} maxLength={2000} />
                </Field>
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
                >
                  Save details
                </button>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-ink">{client.name}</p>
                <p className="text-ink-muted">{client.phone ?? 'No phone'}</p>
                <p className="text-ink-muted">{client.email ?? 'No email'}</p>
                {client.notes ? <p className="text-xs leading-relaxed text-ink-muted">{client.notes}</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {client.events.length === 0 && client.enquiries.length === 0 ? (
        <EmptyState
          title="Nothing linked yet"
          description="Convert an enquiry to an event and this page becomes the client's whole history."
        />
      ) : null}
    </div>
  )
}
