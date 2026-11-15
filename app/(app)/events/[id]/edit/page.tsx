import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { EventForm } from '@/components/events/event-form'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEventDetail, getEventFormOptions } from '@/lib/db/events'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { updateEvent } from '../../actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('events.edit.title') }
}

/** `?error=` codes are machine values; the sentence comes from the catalogue. */
const ERROR_KEYS: Record<string, string> = {
  date: 'events.errors.date',
  guests: 'events.errors.guests',
  permission: 'events.errors.editPermission',
  demo: 'events.errors.editDemo',
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const { id } = await params
  const query = await searchParams
  const [event, options] = await withWorkspace(ctx, () =>
    Promise.all([
      getEventDetail(ctx.orgId, ctx.demo, id),
      getEventFormOptions(ctx.orgId, ctx.demo),
    ]),
  )

  if (!event) notFound()

  const errorKey = query.error ? ERROR_KEYS[query.error] : undefined

  return (
    <div className="space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('events.edit.back')}
      </Link>

      <PageHeader
        eyebrow={event.title}
        title={t('events.edit.title')}
        description={t('events.edit.intro')}
      />

      {errorKey ? (
        <div role="alert" className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}

      {!canManageCommercial(ctx.role) || ctx.demo ? (
        <div className="card-surface p-4 text-sm text-ink-muted">
          {t('events.edit.readOnly')}
        </div>
      ) : (
        <EventForm
          action={updateEvent}
          clients={options.clients}
          submitLabel={t('events.form.save')}
          cancelHref={`/events/${id}`}
          locale={locale}
          defaults={{
            title: event.title,
            clientId: event.clientId ?? null,
            clientName: event.clientName,
            eventType: event.eventType,
            eventDate: event.eventDate,
            guests: event.guests,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            startTime: event.startTime,
            endTime: event.endTime,
            status: event.status,
            notes: event.notes,
          }}
        />
      )}
    </div>
  )
}
