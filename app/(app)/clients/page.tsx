import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarPlus, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/input'
import { DebouncedSearch } from '@/components/debounced-search'
import { Pagination } from '@/components/pagination'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getEnquiryPage } from '@/lib/db/crm'
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABEL,
  type EnquiryStatus,
} from '@/lib/domain/ops'
import { PAGE_SIZE, pageHref, parsePage } from '@/lib/pagination'
import { relativeDays, shortDate } from '@/lib/utils'
import { convertEnquiryToEvent, setEnquiryStatus } from './actions'

export const metadata = { title: 'Enquiries' }

const TONE: Record<EnquiryStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  new: 'mint',
  contacted: 'gold',
  qualified: 'accent',
  quoted: 'mint',
  won: 'success',
  lost: 'neutral',
  spam: 'neutral',
}

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can change an enquiry.',
  demo: 'Demo mode: connect a database before changing an enquiry.',
  invalid: 'That enquiry or status is not valid.',
  missing: 'That enquiry no longer exists.',
  already: 'That enquiry has already been converted to an event.',
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const page = parsePage(params.page)
  const data = await getEnquiryPage(ctx.orgId, ctx.demo, {
    q: params.q,
    status: params.status,
    page,
  })
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const tabs = [
    { key: '', label: 'All', count: Object.values(data.counts).reduce((a, b) => a + b, 0) },
    ...ENQUIRY_STATUSES.map((status) => ({
      key: status,
      label: ENQUIRY_STATUS_LABEL[status],
      count: data.counts[status] ?? 0,
    })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Every enquiry, and what happened next"
        description="A quote with no enquiry behind it is a guess. This is where a public form submission becomes a client, a follow-up and finally an event."
        actions={
          <Link
            href="/events#new"
            className="inline-flex h-11 items-center gap-2 rounded-control bg-forest px-4 text-sm font-medium text-white"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            New event
          </Link>
        }
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
      {ctx.demo ? (
        <div className="rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          Demo data. Enquiry changes are disabled until a database is connected.
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
            <DebouncedSearch placeholder="Search name, phone or occasion" />
          </Suspense>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" aria-hidden />}
          title="No enquiries match"
          description="Clear the search or status filter. New enquiries arrive from your public page and are listed here immediately."
          action={
            <Link href="/clients" className="text-sm text-forest underline underline-offset-4">
              Clear filters
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.rows.map((row) => (
            <article
              key={row.id}
              className="rounded-card border border-hairline bg-paper p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-ink">{row.clientName}</h2>
                    <Badge tone={TONE[row.status]}>{ENQUIRY_STATUS_LABEL[row.status]}</Badge>
                    {row.source ? <Badge tone="outline">{row.source}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {row.phone ?? 'No phone'} ·{' '}
                    {row.eventDate
                      ? `${shortDate(row.eventDate)} (${relativeDays(row.eventDate)})`
                      : 'Date not decided'}{' '}
                    · {row.guests} guests
                    {row.eventType ? ` · ${row.eventType}` : ''}
                  </p>
                  {row.message ? (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                      {row.message}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-ink-muted">
                    Received {shortDate(row.createdAt.slice(0, 10))}
                    {row.nextFollowUpAt
                      ? ` · Follow up ${shortDate(row.nextFollowUpAt.slice(0, 10))}`
                      : ' · No follow-up set'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={setEnquiryStatus} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={row.id} />
                    <Select
                      name="status"
                      defaultValue={row.status}
                      disabled={!canEdit}
                      aria-label={`Status for ${row.clientName}`}
                      className="h-9 w-32 text-xs"
                    >
                      {ENQUIRY_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ENQUIRY_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="submit"
                      disabled={!canEdit}
                      className="text-xs font-medium text-forest underline underline-offset-2 disabled:opacity-40"
                    >
                      Save
                    </button>
                  </form>

                  <form action={convertEnquiryToEvent}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      disabled={!canEdit || row.status === 'won'}
                      className="inline-flex h-9 items-center gap-1.5 rounded-control bg-forest px-3 text-xs font-medium text-white disabled:opacity-40"
                    >
                      Convert to event
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination
        basePath="/clients"
        page={data.page}
        total={data.total}
        pageSize={PAGE_SIZE}
        params={{ q: params.q, status: params.status }}
      />
    </div>
  )
}
