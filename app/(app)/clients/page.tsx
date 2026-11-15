import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarPlus, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/input'
import { DebouncedSearch } from '@/components/debounced-search'
import { Pagination } from '@/components/pagination'
import { createTranslator } from '@/lib/i18n'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { relativeDaysLocalised } from '@/lib/i18n/format'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEnquiryPage } from '@/lib/db/crm'
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/lib/domain/ops'
import { PAGE_SIZE, pageHref, parsePage } from '@/lib/pagination'
import { shortDate } from '@/lib/utils'
import { convertEnquiryToEvent, setEnquiryStatus } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('clients.title') }
}

const TONE: Record<EnquiryStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  new: 'mint',
  contacted: 'gold',
  qualified: 'accent',
  quoted: 'mint',
  won: 'success',
  lost: 'neutral',
  spam: 'neutral',
}

/** `?error=` codes are machine values; the sentence comes from the catalogue. */
const ERROR_KEYS: Record<string, string> = {
  permission: 'clients.errors.permission',
  demo: 'clients.errors.demo',
  invalid: 'clients.errors.invalid',
  missing: 'clients.errors.missing',
  already: 'clients.errors.already',
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams
  const page = parsePage(params.page)
  const data = await withWorkspace(ctx, () =>
    getEnquiryPage(ctx.orgId, ctx.demo, {
      q: params.q,
      status: params.status,
      page,
    }),
  )
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const contactLine = (row: (typeof data.rows)[number]) =>
    [
      row.phone ?? t('clients.noPhone'),
      row.eventDate
        ? `${shortDate(row.eventDate)} (${relativeDaysLocalised(row.eventDate, locale)})`
        : t('clients.dateNotDecided'),
      `${row.guests} ${t('clients.guests')}`,
    ].join(' · ')

  /** Same controls on desktop and in the card footer, so neither loses a verb. */
  const renderActions = (row: (typeof data.rows)[number]) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={setEnquiryStatus} className="flex items-center gap-1.5">
        <input type="hidden" name="id" value={row.id} />
        <Select
          name="status"
          defaultValue={row.status}
          disabled={!canEdit}
          aria-label={`${t('clients.statusLabel')} — ${row.clientName}`}
          className="h-9 w-32 text-xs"
        >
          {ENQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`clients.enquiryStatus.${status}`)}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          disabled={!canEdit}
          className="text-xs font-medium text-forest underline underline-offset-2 disabled:opacity-40"
        >
          {t('clients.save')}
        </button>
      </form>

      <form action={convertEnquiryToEvent}>
        <input type="hidden" name="id" value={row.id} />
        <button
          type="submit"
          disabled={!canEdit || row.status === 'won'}
          className="inline-flex h-9 items-center gap-1.5 rounded-control bg-forest px-3 text-xs font-medium text-white disabled:opacity-40"
        >
          {t('clients.convertToEvent')}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
    </div>
  )

  const tabs = [
    { key: '', label: t('clients.tabAll'), count: Object.values(data.counts).reduce((a, b) => a + b, 0) },
    ...ENQUIRY_STATUSES.map((status) => ({
      key: status,
      label: t(`clients.enquiryStatus.${status}`),
      count: data.counts[status] ?? 0,
    })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('clients.eyebrow')}
        title={t('clients.heading')}
        description={t('clients.intro')}
        actions={
          <>
            <Link href="/clients/directory" className="btn btn-md btn-outline">
              {t('clients.directory')}
            </Link>
            <Link href="/events#new" className="btn btn-md btn-primary">
              <CalendarPlus className="h-4 w-4" aria-hidden /> {t('clients.newEvent')}
            </Link>
          </>
        }
      />

      {params.error ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(ERROR_KEYS[params.error] ?? 'clients.errors.fallback')}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('clients.errors.saved')}
        </div>
      ) : null}
      {ctx.demo ? (
        <div className="card-flat bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('clients.demoNotice')}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const active = (params.status ?? '') === tab.key
            return (
              <Link
                key={tab.key || 'all'}
                href={pageHref('/clients', { q: params.q, status: tab.key || undefined })}
                className={
                  active
                    ? 'whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white'
                    : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-muted'
                }
              >
                {tab.label}
                <span className={active ? 'ml-1.5 text-white/70' : 'ml-1.5 text-ink-muted/70'}>
                  {tab.count}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="w-full sm:max-w-xs">
          <Suspense fallback={<div className="h-10 rounded-control border border-hairline bg-paper" />}>
            <DebouncedSearch placeholder={t('clients.searchPlaceholder')} />
          </Suspense>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" aria-hidden />}
          title={t('clients.emptyTitle')}
          description={t('clients.emptyBody')}
          action={
            <Link href="/clients" className="text-sm text-forest underline underline-offset-4">
              {t('clients.clearFilters')}
            </Link>
          }
        />
      ) : (
        <DataTable
          rows={data.rows}
          rowKey={(row) => row.id}
          density="comfortable"
          columns={[
            {
              key: 'enquiry',
              header: t('clients.table.enquiry'),
              cell: (row) => (
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.clientId ? (
                      <Link
                        href={`/clients/${row.clientId}`}
                        className="truncate font-medium text-ink hover:text-forest hover:underline"
                      >
                        {row.clientName}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-ink">{row.clientName}</span>
                    )}
                    <Badge tone={TONE[row.status]}>{t(`clients.enquiryStatus.${row.status}`)}</Badge>
                    {row.source ? <Badge tone="outline">{row.source}</Badge> : null}
                  </div>
                  {row.message ? (
                    <p className="mt-1 line-clamp-1 max-w-xl text-xs text-ink-muted">{row.message}</p>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'contact',
              header: t('clients.table.contact'),
              secondary: true,
              className: 'w-72',
              cell: (row) => (
                <span className="text-xs leading-relaxed text-ink-muted">{contactLine(row)}</span>
              ),
            },
            {
              key: 'received',
              header: t('clients.table.received'),
              secondary: true,
              className: 'w-40',
              cell: (row) => (
                <>
                  <p className="text-sm">{shortDate(row.createdAt.slice(0, 10))}</p>
                  <p className="text-xs text-ink-muted">
                    {row.nextFollowUpAt
                      ? `${t('clients.followUp')} ${shortDate(row.nextFollowUpAt.slice(0, 10))}`
                      : t('clients.noFollowUp')}
                  </p>
                </>
              ),
            },
            {
              key: 'actions',
              header: t('clients.table.actions'),
              align: 'end',
              className: 'w-64',
              cell: renderActions,
            },
          ]}
          mobileTitle={(row) => row.clientName}
          mobileMeta={(row) => `${contactLine(row)}`}
          mobileTrailing={(row) => (
            <div className="space-y-1.5">
              <Badge tone={TONE[row.status]}>{t(`clients.enquiryStatus.${row.status}`)}</Badge>
              <p className="text-[11px] text-ink-muted">{shortDate(row.createdAt.slice(0, 10))}</p>
            </div>
          )}
          mobileActions={renderActions}
        />
      )}

      <Pagination
        basePath="/clients"
        page={data.page}
        total={data.total}
        pageSize={PAGE_SIZE}
        params={{ q: params.q, status: params.status }}
        locale={locale}
      />
    </div>
  )
}
