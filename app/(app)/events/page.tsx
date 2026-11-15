import { Suspense } from 'react'
import Link from 'next/link'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { DebouncedSearch } from '@/components/debounced-search'
import { Pagination } from '@/components/pagination'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEventFormOptions, getEventPage } from '@/lib/db/events'
import { EVENT_STATUSES, type EventStatus } from '@/lib/domain/ops'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, relativeDaysLocalised } from '@/lib/i18n/format'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { eventStatusKey } from '@/lib/i18n/ops-copy'
import { PAGE_SIZE, pageHref, parsePage } from '@/lib/pagination'
import { CreateEventForm } from './_components/create-event-form'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('events.list.title') }
}

const TONE: Record<EventStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  enquiry: 'neutral',
  tentative: 'gold',
  confirmed: 'success',
  completed: 'mint',
  cancelled: 'accent',
}

/** `?error=` codes are machine values; the sentence comes from the catalogue. */
const ERROR_KEYS: Record<string, string> = {
  permission: 'events.errors.createPermission',
  demo: 'events.errors.createDemo',
  date: 'events.errors.date',
  guests: 'events.errors.guests',
  invalid: 'events.errors.invalid',
  missing: 'events.errors.missing',
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams
  const page = parsePage(params.page)
  const [data, options] = await withWorkspace(ctx, () =>
    Promise.all([
      getEventPage(ctx.orgId, ctx.demo, { q: params.q, status: params.status, page }),
      getEventFormOptions(ctx.orgId, ctx.demo),
    ]),
  )
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const errorKey = params.error ? ERROR_KEYS[params.error] : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('events.list.eyebrow')}
        title={t('events.list.heading')}
        description={t('events.list.intro')}
        actions={
          <>
            <Link
              href="/events/calendar"
              className="btn btn-md btn-outline"
            >
              {t('events.list.calendar')}
            </Link>
            <Link
              href="#new"
              className="btn btn-md btn-primary"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden /> {t('events.list.newEvent')}
            </Link>
          </>
        }
      />

      {errorKey ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Link
            href={pageHref('/events', { q: params.q })}
            className={
              !params.status
                ? 'whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white'
                : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-muted'
            }
          >
            {t('events.list.all')}
          </Link>
          {EVENT_STATUSES.map((status) => (
            <Link
              key={status}
              href={pageHref('/events', { q: params.q, status })}
              className={
                params.status === status
                  ? 'whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white'
                  : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs text-ink-muted'
              }
            >
              {t(eventStatusKey(status))}
            </Link>
          ))}
        </div>
        <div className="w-full sm:max-w-xs">
          <Suspense fallback={<div className="h-10 rounded-control border border-hairline bg-paper" />}>
            <DebouncedSearch placeholder={t('events.list.searchPlaceholder')} />
          </Suspense>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" aria-hidden />}
          title={t('events.list.emptyTitle')}
          description={t('events.list.emptyBody')}
          action={
            <Link href="#new" className="text-sm text-forest underline underline-offset-4">
              {t('events.list.emptyAction')}
            </Link>
          }
        />
      ) : (
        <DataTable
          rows={data.rows}
          rowKey={(row) => row.id}
          href={(row) => `/events/${row.id}`}
          rowLabel={(row) => row.title}
          density="comfortable"
          columns={[
            {
              key: 'event',
              header: t('events.table.event'),
              cell: (row) => (
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{row.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {row.clientName ?? t('events.list.noClient')}
                    {row.venueName ? ` · ${row.venueName}` : ''}
                  </p>
                </div>
              ),
            },
            {
              key: 'date',
              header: t('events.table.date'),
              secondary: true,
              className: 'w-48',
              cell: (row) => (
                <>
                  <p>
                    {formatDateLocalised(row.eventDate, locale, 'short', 'numeric')}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {relativeDaysLocalised(row.eventDate, locale)}
                  </p>
                </>
              ),
            },
            {
              key: 'tasks',
              header: t('events.table.tasks'),
              align: 'end',
              className: 'w-24',
              cell: (row) =>
                row.openTasks > 0 ? (
                  <span className="tabular text-ink-muted">{row.openTasks}</span>
                ) : (
                  <span className="text-xs text-ink-muted">—</span>
                ),
            },
            {
              key: 'status',
              header: t('events.table.status'),
              align: 'end',
              className: 'w-32',
              cell: (row) => <Badge tone={TONE[row.status]}>{t(eventStatusKey(row.status))}</Badge>,
            },
          ]}
          mobileTitle={(row) => row.title}
          mobileMeta={(row) =>
            t('events.list.rowMeta', {
              client: row.clientName ?? t('events.list.noClient'),
              date: formatDateLocalised(row.eventDate, locale, 'short', 'numeric'),
              relative: relativeDaysLocalised(row.eventDate, locale),
              guests: row.guests,
            })
          }
          mobileTrailing={(row) => (
            <div className="space-y-1.5">
              <Badge tone={TONE[row.status]}>{t(eventStatusKey(row.status))}</Badge>
              {row.openTasks > 0 ? (
                <p className="text-[11px] text-ink-muted">
                  {t('events.list.open', { count: row.openTasks })}
                </p>
              ) : null}
            </div>
          )}
        />
      )}

      <Pagination
        basePath="/events"
        page={data.page}
        total={data.total}
        pageSize={PAGE_SIZE}
        params={{ q: params.q, status: params.status }}
        locale={locale}
      />

      <CreateEventForm clients={options.clients} canEdit={canEdit} demo={ctx.demo} locale={locale} />
    </div>
  )
}
