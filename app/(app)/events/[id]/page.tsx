import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, IndianRupee, Layers, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { Stat } from '@/components/ui/stat'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEventDetail, getEventFormOptions } from '@/lib/db/events'
import { getEnabledServices } from '@/lib/db/queries'
import { getShareLink } from '@/lib/db/share'
import { EVENT_STATUSES, type EventDetail, type EventStatus } from '@/lib/domain/ops'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { eventStatusKey } from '@/lib/i18n/ops-copy'
import { updateEventStatus } from '../actions'
import { OperationsTab } from './_components/operations-tab'
import { CrewTab } from './_components/crew-tab'
import { ServicesTab } from './_components/services-tab'
import { MoneyTab } from './_components/money-tab'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('events.detail.title') }
}

const TONE: Record<EventStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  enquiry: 'neutral',
  tentative: 'gold',
  confirmed: 'success',
  completed: 'mint',
  cancelled: 'accent',
}

const TABS = [
  { key: 'operations', labelKey: 'events.detail.tabs.operations', icon: ClipboardList },
  { key: 'crew', labelKey: 'events.detail.tabs.crew', icon: Users },
  { key: 'services', labelKey: 'events.detail.tabs.services', icon: Layers },
  { key: 'money', labelKey: 'events.detail.tabs.money', icon: IndianRupee },
] as const

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const { id } = await params
  const query = await searchParams
  const [event, options, enabledServices, shareLink] = await withWorkspace(ctx, () =>
    Promise.all([
      getEventDetail(ctx.orgId, ctx.demo, id),
      getEventFormOptions(ctx.orgId, ctx.demo),
      getEnabledServices(ctx.orgId, ctx.demo),
      getShareLink(ctx.orgId, id),
    ]),
  )
  const attached = new Set(event?.services.map((service) => service.key) ?? [])
  const availableServices = enabledServices.filter(
    (service) => service.enabled && !attached.has(service.key),
  )

  if (!event) notFound()

  const tab = TABS.some((item) => item.key === query.tab) ? query.tab : 'operations'
  const quoteTotal = event.quotes.reduce((sum, quote) => sum + quote.totalPaise, 0)
  const balance = quoteTotal - event.paidPaise

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('events.detail.back')}
      </Link>

      <EventHeader event={event} demo={ctx.demo} locale={locale} />

      {query.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('events.detail.saved')}
        </div>
      ) : null}
      {query.error ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t('events.detail.error')}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t('events.detail.stats.quoted')}
          value={formatPaiseLocalised(quoteTotal, locale)}
          hint={t('events.detail.stats.quotedHint')}
        />
        <Stat
          label={t('events.detail.stats.received')}
          value={formatPaiseLocalised(event.paidPaise, locale)}
          hint={t('events.detail.stats.receivedHint')}
          tone="positive"
        />
        <Stat
          label={t('events.detail.stats.costs')}
          value={formatPaiseLocalised(event.expensesPaise, locale)}
          hint={t('events.detail.stats.costsHint')}
        />
        <Stat
          label={t('events.detail.stats.balance')}
          value={formatPaiseLocalised(balance, locale)}
          hint={
            balance > 0
              ? t('events.detail.stats.stillToCollect')
              : t('events.detail.stats.nothingOutstanding')
          }
          tone={balance > 0 ? 'warning' : 'positive'}
        />
      </section>

      <nav className="flex gap-1.5 overflow-x-auto border-b border-hairline pb-2 no-scrollbar">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.key
          return (
            <Link
              key={item.key}
              href={`/events/${event.id}?tab=${item.key}`}
              className={
                active
                  ? 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-control bg-forest px-3 py-2 text-xs font-medium text-white'
                  : 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-control px-3 py-2 text-xs text-ink-muted hover:bg-mint-subtle'
              }
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      {tab === 'operations' ? (
        <OperationsTab event={event} staff={options.staff} demo={ctx.demo} locale={locale} />
      ) : null}

      {tab === 'crew' ? (
        <CrewTab event={event} staff={options.staff} demo={ctx.demo} locale={locale} />
      ) : null}

      {tab === 'services' ? (
        <ServicesTab
          event={event}
          availableServices={availableServices}
          shareLink={shareLink}
          demo={ctx.demo}
          locale={locale}
        />
      ) : null}

      {tab === 'money' ? (
        <MoneyTab event={event} quoteTotal={quoteTotal} balance={balance} locale={locale} />
      ) : null}
    </div>
  )
}

/** Badges, dates and the status form: the part every tab shares. */
function EventHeader({
  event,
  demo,
  locale,
}: {
  event: EventDetail
  demo: boolean
  locale: Locale
}) {
  const t = translatorFor(locale)

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONE[event.status]}>{t(eventStatusKey(event.status))}</Badge>
          {event.eventType ? <Badge tone="outline">{event.eventType}</Badge> : null}
        </div>
        <h1 className="font-display text-2xl leading-tight text-forest sm:text-3xl">{event.title}</h1>
        <p className="text-sm text-ink-muted">
          {t('events.detail.dateGuests', {
            date: formatDateLocalised(event.eventDate, locale, 'short', 'numeric'),
            guests: event.guests,
          })}
          {event.startTime ? ` · ${event.startTime}` : ''}
          {event.endTime ? `–${event.endTime}` : ''}
        </p>
        <p className="text-sm text-ink-muted">
          {event.clientName ?? t('events.detail.noClient')}
          {event.clientPhone ? ` · ${event.clientPhone}` : ''}
        </p>
        {event.venueName ? (
          <p className="text-sm text-ink">
            {event.venueName}
            {event.venueAddress ? (
              <span className="block text-xs text-ink-muted">{event.venueAddress}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-2">
        <form action={updateEventStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={event.id} />
          <Select
            name="status"
            defaultValue={event.status}
            aria-label={t('events.detail.statusLabel')}
            className="h-10 w-36"
            disabled={demo}
          >
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(eventStatusKey(status))}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            disabled={demo}
            className="inline-flex h-10 items-center rounded-control bg-forest px-3 text-xs font-medium text-white disabled:opacity-50"
          >
            {t('events.detail.update')}
          </button>
        </form>
        <Link
          href={`/events/${event.id}/edit`}
          className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
        >
          {t('events.detail.edit')}
        </Link>
        <Link
          href={`/events/${event.id}/catering`}
          className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
        >
          {t('events.detail.catering')}
        </Link>
        <Link
          href={`/invoices?event=${event.id}`}
          className="text-xs text-forest underline underline-offset-4"
        >
          {t('events.detail.invoice')}
        </Link>
      </div>
    </header>
  )
}
