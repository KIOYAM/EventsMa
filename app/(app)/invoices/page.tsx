import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { Pagination } from '@/components/pagination'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getAcceptedQuoteOptions, getInvoicePage } from '@/lib/db/money'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from '@/lib/domain/ops'
import { PAGE_SIZE, parsePage } from '@/lib/pagination'
import { shortDate } from '@/lib/utils'
import { createInvoice } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('invoices.title') }
}

const ERROR_KEYS: Record<string, string> = {
  permission: 'invoices.errors.permission',
  demo: 'invoices.errors.demo',
  quote: 'invoices.errors.quote',
  missing: 'invoices.errors.missing',
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    page?: string
    error?: string
    saved?: string
    event?: string
    quote?: string
  }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams
  const page = parsePage(params.page)
  const [data, quotes] = await withWorkspace(ctx, () =>
    Promise.all([
      getInvoicePage(ctx.orgId, ctx.demo, { status: params.status, page }),
      getAcceptedQuoteOptions(ctx.orgId, ctx.demo),
    ]),
  )
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const available = quotes.filter((quote) => !quote.alreadyInvoiced)
  const dueDefault = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

  const errorKey = params.error ? ERROR_KEYS[params.error] : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('invoices.eyebrow')}
        title={t('invoices.heading')}
        description={t('invoices.intro')}
      />

      {errorKey ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {params.saved === 'existing' ? (
            t('invoices.saved.existing')
          ) : params.saved === 'settled' ? (
            t('invoices.saved.settled')
          ) : (
            t('invoices.saved.payment')
          )}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t('invoices.stats.outstanding')}
          value={formatPaiseLocalised(data.outstandingPaise, locale)}
          hint={t('invoices.stats.outstanding')}
          tone={data.outstandingPaise > 0 ? 'warning' : 'positive'}
        />
        <Stat label={t('invoices.stats.invoices')} value={String(data.total)} hint="Issued and paid" />
        <Stat
          label={t('invoices.stats.acceptedQuotes')}
          value={String(available.length)}
          hint="Ready to invoice"
        />
        <Stat
          label={t('invoices.stats.collected')}
          value={formatPaiseLocalised(
            data.rows.reduce((sum, row) => sum + row.paidPaise, 0),
            locale,
          )}
          hint="This page"
          tone="positive"
        />
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
          {t('invoices.all')}
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
            {t(`invoices.tab.${status}`)}
          </Link>
        ))}
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          title={t('invoices.emptyTitle')}
          description={t('invoices.emptyBody')}
        />
      ) : (
        <div className="overflow-hidden card-surface">
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
                  {row.clientName ?? t('invoices.detail.noClient')}
                  {row.dueOn ? ` · due ${shortDate(row.dueOn)}` : ''} · issued{' '}
                  {shortDate(row.issuedAt.slice(0, 10))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="tabular text-sm text-ink">
                    {formatPaiseLocalised(row.amountPaise, locale)}
                  </p>
                  <p className="tabular text-[11px] text-ink-muted">
                    {formatPaiseLocalised(row.paidPaise, locale)} received
                  </p>
                </div>
                <Badge tone="neutral">{t(`invoices.tab.${row.status}`)}</Badge>
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
        locale={locale}
      />

      <Card id="new">
        <CardHeader>
          <CardTitle>{t('invoices.raiseTitle')}</CardTitle>
          <Badge tone="outline">{available.length} ready</Badge>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('invoices.raiseIntro')}</p>
          ) : (
            <form action={createInvoice} className="grid gap-4 md:grid-cols-2">
              <Field
                label={t('invoices.quote')}
                htmlFor="quotationId"
                className="md:col-span-2"
              >
                <Select
                  id="quotationId"
                  name="quotationId"
                  required
                  defaultValue={params.quote ?? ''}
                >
                  <option value="" disabled>
                    {t('invoices.chooseQuote')}
                  </option>
                  {available.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.number} · {quote.eventTitle} · {formatPaiseLocalised(
                        quote.amountPaise,
                        locale,
                      )}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('invoices.dueDate')} htmlFor="dueOn">
                <Input id="dueOn" name="dueOn" type="date" defaultValue={dueDefault} />
              </Field>
              <Field label={t('invoices.notes')} htmlFor="invoiceNotes">
                <Textarea
                  id="invoiceNotes"
                  name="notes"
                  className="min-h-11"
                  placeholder={t('invoices.notesPlaceholder')}
                />
              </Field>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="inline-flex h-11 items-center rounded-control bg-forest px-5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {t('invoices.raiseInvoice')}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
