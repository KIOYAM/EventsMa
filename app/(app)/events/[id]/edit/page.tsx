import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { EventForm } from '@/components/events/event-form'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getEventDetail, getEventFormOptions } from '@/lib/db/events'
import { updateEvent } from '../../actions'

export const metadata = { title: 'Edit event' }

const ERROR_COPY: Record<string, string> = {
  date: 'Choose a valid event date.',
  guests: 'Guest count must be a number.',
  permission: 'Only an owner or manager can edit an event.',
  demo: 'Demo mode: connect a database before editing.',
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const ctx = await requireWorkspace()
  const { id } = await params
  const query = await searchParams
  const [event, options] = await Promise.all([
    getEventDetail(ctx.orgId, ctx.demo, id),
    getEventFormOptions(ctx.orgId, ctx.demo),
  ])

  if (!event) notFound()

  return (
    <div className="space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to event
      </Link>

      <PageHeader
        eyebrow={event.title}
        title="Edit the event"
        description="Changing the date here updates the run sheet. Quotations already sent keep their own snapshot and are not rewritten."
      />

      {query.error && ERROR_COPY[query.error] ? (
        <div role="alert" className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[query.error]}
        </div>
      ) : null}

      {!canManageCommercial(ctx.role) || ctx.demo ? (
        <div className="rounded-card border border-hairline bg-paper p-4 text-sm text-ink-muted">
          This event is read-only for this account.
        </div>
      ) : (
        <EventForm
          action={updateEvent}
          clients={options.clients}
          submitLabel="Save event"
          cancelHref={`/events/${id}`}
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
