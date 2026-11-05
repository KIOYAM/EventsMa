import { Suspense } from 'react'
import Link from 'next/link'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { DebouncedSearch } from '@/components/debounced-search'
import { Pagination } from '@/components/pagination'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getEventFormOptions, getEventPage } from '@/lib/db/events'
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABEL,
  type EventStatus,
} from '@/lib/domain/ops'
import { PAGE_SIZE, pageHref, parsePage } from '@/lib/pagination'
import { relativeDays, shortDate } from '@/lib/utils'
import { createEvent } from './actions'

export const metadata = { title: 'Events' }

const TONE: Record<EventStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  enquiry: 'neutral',
  tentative: 'gold',
  confirmed: 'success',
  completed: 'mint',
  cancelled: 'accent',
}

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can create events.',
  demo: 'Demo mode: connect a database before creating an event.',
  date: 'Choose a valid event date.',
  guests: 'Guest count must be a number.',
  invalid: 'That event or status is not valid.',
  missing: 'The event could not be created.',
}

const today = () => new Date().toISOString().slice(0, 10)

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const page = parsePage(params.page)
  const [data, options] = await Promise.all([
    getEventPage(ctx.orgId, ctx.demo, { q: params.q, status: params.status, page }),
    getEventFormOptions(ctx.orgId, ctx.demo),
  ])
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="The event is the spine"
        description="Enquiries become events, events carry quotes, and delivered events settle into invoices. Nothing here is typed twice."
        actions={
          <>
            <Link
              href="/events/calendar"
              className="inline-flex h-11 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
            >
              Calendar
            </Link>
            <Link
              href="#new"
              className="inline-flex h-11 items-center gap-2 rounded-control bg-forest px-4 text-sm font-medium text-white"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              New event
            </Link>
          </>
        }
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
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
            All
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
              {EVENT_STATUS_LABEL[status]}
            </Link>
          ))}
        </div>
        <div className="w-full sm:max-w-xs">
          <Suspense fallback={<div className="h-10 rounded-control border border-hairline bg-paper" />}>
            <DebouncedSearch placeholder="Search event, client or venue" />
          </Suspense>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" aria-hidden />}
          title="No events match"
          description="Create the first event, or convert an enquiry from the inbox. A confirmed date is what makes a quote believable."
          action={
            <Link href="#new" className="text-sm text-forest underline underline-offset-4">
              Create an event
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-hairline bg-paper">
          {data.rows.map((row) => (
            <Link
              key={row.id}
              href={`/events/${row.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-4 py-3.5 last:border-b-0 hover:bg-mint-subtle/60 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{row.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {row.clientName ?? 'No client'} · {shortDate(row.eventDate)} (
                  {relativeDays(row.eventDate)}) · {row.guests} guests
                  {row.venueName ? ` · ${row.venueName}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.openTasks > 0 ? (
                  <span className="text-[11px] text-ink-muted">{row.openTasks} open</span>
                ) : null}
                <Badge tone={TONE[row.status]}>{EVENT_STATUS_LABEL[row.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        basePath="/events"
        page={data.page}
        total={data.total}
        pageSize={PAGE_SIZE}
        params={{ q: params.q, status: params.status }}
      />

      <Card id="new">
        <CardHeader>
          <CardTitle>Create an event</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEvent} className="grid gap-4 md:grid-cols-2">
            <Field label="Event title" htmlFor="title" hint="Leave blank to build it from client and occasion.">
              <Input id="title" name="title" placeholder="Meera & Karthik — Wedding lunch" maxLength={160} />
            </Field>
            <Field label="Occasion" htmlFor="eventType">
              <Input id="eventType" name="eventType" placeholder="Wedding lunch" maxLength={80} />
            </Field>

            <Field label="Client" htmlFor="clientId" hint="Or add a new client below.">
              <Select id="clientId" name="clientId" defaultValue="">
                <option value="">New client</option>
                {options.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="New client name" htmlFor="clientName">
                <Input id="clientName" name="clientName" maxLength={120} />
              </Field>
              <Field label="Phone" htmlFor="clientPhone">
                <Input id="clientPhone" name="clientPhone" inputMode="tel" maxLength={24} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Event date" htmlFor="eventDate">
                <Input id="eventDate" name="eventDate" type="date" required defaultValue={today()} />
              </Field>
              <Field label="Guests" htmlFor="guests">
                <Input id="guests" name="guests" inputMode="numeric" defaultValue={100} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time" htmlFor="startTime">
                <Input id="startTime" name="startTime" type="time" />
              </Field>
              <Field label="End time" htmlFor="endTime">
                <Input id="endTime" name="endTime" type="time" />
              </Field>
            </div>

            <Field label="Venue" htmlFor="venueName">
              <Input id="venueName" name="venueName" maxLength={160} />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue="tentative">
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {EVENT_STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Venue address" htmlFor="venueAddress" className="md:col-span-2">
              <Input id="venueAddress" name="venueAddress" maxLength={240} />
            </Field>
            <Field label="Notes" htmlFor="notes" className="md:col-span-2">
              <Textarea id="notes" name="notes" maxLength={2000} placeholder="Pure veg, banana leaf for elders, stage florals in marigold." />
            </Field>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={!canEdit}
                className="inline-flex h-11 items-center rounded-control bg-forest px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                Create event
              </button>
              {!canEdit ? (
                <p className="mt-2 text-xs text-ink-muted">
                  {ctx.demo ? 'Demo mode is read-only.' : 'Owner or manager only.'}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
