import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, IndianRupee, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { requireWorkspace } from '@/lib/auth/session'
import { getEventDetail, getEventFormOptions } from '@/lib/db/events'
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  type EventStatus,
} from '@/lib/domain/ops'
import { formatINR } from '@/lib/domain/money'
import { shortDate } from '@/lib/utils'
import {
  addEventTask,
  addEventVendor,
  assignCrew,
  setCrewCheckIn,
  setTaskStatus,
  updateEventStatus,
} from '../actions'

export const metadata = { title: 'Event' }

const TONE: Record<EventStatus, 'success' | 'mint' | 'gold' | 'accent' | 'neutral'> = {
  enquiry: 'neutral',
  tentative: 'gold',
  confirmed: 'success',
  completed: 'mint',
  cancelled: 'accent',
}

const TABS = [
  { key: 'operations', label: 'Operations', icon: ClipboardList },
  { key: 'crew', label: 'Crew', icon: Users },
  { key: 'money', label: 'Money', icon: IndianRupee },
] as const

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const { id } = await params
  const query = await searchParams
  const [event, options] = await Promise.all([
    getEventDetail(ctx.orgId, ctx.demo, id),
    getEventFormOptions(ctx.orgId, ctx.demo),
  ])

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
        All events
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[event.status]}>{EVENT_STATUS_LABEL[event.status]}</Badge>
            {event.eventType ? <Badge tone="outline">{event.eventType}</Badge> : null}
          </div>
          <h1 className="font-display text-2xl leading-tight text-forest sm:text-3xl">
            {event.title}
          </h1>
          <p className="text-sm text-ink-muted">
            {shortDate(event.eventDate)} · {event.guests} guests
            {event.startTime ? ` · ${event.startTime}` : ''}
            {event.endTime ? `–${event.endTime}` : ''}
          </p>
          <p className="text-sm text-ink-muted">
            {event.clientName ?? 'No client'}
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
              aria-label="Event status"
              className="h-10 w-36"
              disabled={ctx.demo}
            >
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {EVENT_STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              disabled={ctx.demo}
              className="inline-flex h-10 items-center rounded-control bg-forest px-3 text-xs font-medium text-white disabled:opacity-50"
            >
              Update
            </button>
          </form>
          <Link
            href={`/events/${event.id}/edit`}
            className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
          >
            Edit event
          </Link>
          <Link
            href={`/invoices?event=${event.id}`}
            className="text-xs text-forest underline underline-offset-4"
          >
            Invoice this event
          </Link>
        </div>
      </header>

      {query.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Saved.
        </div>
      ) : null}
      {query.error ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          Check the field and try again.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Quoted" value={formatINR(quoteTotal, { compact: true })} hint="Current versions" />
        <Stat label="Received" value={formatINR(event.paidPaise, { compact: true })} hint="Captured payments" tone="positive" />
        <Stat label="Costs recorded" value={formatINR(event.expensesPaise, { compact: true })} hint="Expenses on this event" />
        <Stat
          label="Balance"
          value={formatINR(balance, { compact: true })}
          hint={balance > 0 ? 'Still to collect' : 'Nothing outstanding'}
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
              {item.label}
            </Link>
          )
        })}
      </nav>

      {tab === 'operations' ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Run of show</CardTitle>
              <Badge tone="outline">{event.tasks.length} tasks</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.tasks.length === 0 ? (
                <p className="text-sm text-ink-muted">No tasks yet. The first one is usually the guest count.</p>
              ) : (
                <div className="divide-y divide-hairline">
                  {event.tasks.map((task) => (
                    <div key={task.id} className="flex flex-wrap items-center gap-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{task.title}</p>
                        <p className="text-xs text-ink-muted">
                          {task.ownerName ?? 'Unassigned'}
                          {task.dueOn ? ` · due ${shortDate(task.dueOn)}` : ''}
                        </p>
                      </div>
                      <form action={setTaskStatus} className="flex items-center gap-1.5">
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="taskId" value={task.id} />
                        <Select
                          name="status"
                          defaultValue={task.status}
                          aria-label={`Status for ${task.title}`}
                          className="h-8 w-28 text-xs"
                          disabled={ctx.demo}
                        >
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {TASK_STATUS_LABEL[status]}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="submit"
                          disabled={ctx.demo}
                          className="text-[11px] font-medium text-forest underline underline-offset-2 disabled:opacity-40"
                        >
                          Save
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              <form action={addEventTask} className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
                <input type="hidden" name="eventId" value={event.id} />
                <Field label="Task" htmlFor="taskTitle" className="sm:col-span-2">
                  <Input id="taskTitle" name="title" required maxLength={160} placeholder="Confirm final guest count" />
                </Field>
                <Field label="Owner" htmlFor="taskOwner">
                  <Select id="taskOwner" name="ownerMembershipId" defaultValue="">
                    <option value="">Unassigned</option>
                    {options.staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Due" htmlFor="taskDue">
                  <Input id="taskDue" name="dueOn" type="date" />
                </Field>
                <button
                  type="submit"
                  disabled={ctx.demo}
                  className="inline-flex h-10 items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
                >
                  Add task
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
              <Badge tone="outline">{event.vendors.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.vendors.length === 0 ? (
                <p className="text-sm text-ink-muted">No vendors booked.</p>
              ) : (
                <div className="divide-y divide-hairline">
                  {event.vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{vendor.name}</p>
                        <p className="text-xs text-ink-muted">
                          {vendor.category ?? 'Vendor'} · {vendor.status}
                        </p>
                      </div>
                      <p className="tabular text-xs text-ink">{formatINR(vendor.amountPaise)}</p>
                    </div>
                  ))}
                </div>
              )}

              <form action={addEventVendor} className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
                <input type="hidden" name="eventId" value={event.id} />
                <Field label="Vendor" htmlFor="vendorName" className="sm:col-span-2">
                  <Input id="vendorName" name="name" required maxLength={120} placeholder="Flower House" />
                </Field>
                <Field label="Category" htmlFor="vendorCategory">
                  <Input id="vendorCategory" name="category" maxLength={60} placeholder="Florals" />
                </Field>
                <Field label="Amount (₹)" htmlFor="vendorAmount">
                  <Input id="vendorAmount" name="amount" inputMode="decimal" placeholder="8500" />
                </Field>
                <button
                  type="submit"
                  disabled={ctx.demo}
                  className="inline-flex h-10 items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
                >
                  Add vendor
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === 'crew' ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Assigned crew</CardTitle>
              <Badge tone="outline">{event.crew.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.crew.length === 0 ? (
                <EmptyState
                  title="Nobody assigned yet"
                  description="Assign the counter lead and floor manager before the shift sheet goes out."
                />
              ) : (
                <div className="divide-y divide-hairline">
                  {event.crew.map((member) => (
                    <div key={member.id} className="flex flex-wrap items-center gap-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{member.name}</p>
                        <p className="text-xs text-ink-muted">
                          {member.roleLabel ?? 'Crew'}
                          {member.shiftStart ? ` · ${member.shiftStart}` : ''}
                          {member.shiftEnd ? `–${member.shiftEnd}` : ''}
                        </p>
                      </div>
                      {member.checkedInAt ? <Badge tone="success">Checked in</Badge> : null}
                      <form action={setCrewCheckIn}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="staffId" value={member.id} />
                        <input type="hidden" name="checkedIn" value={member.checkedInAt ? '0' : '1'} />
                        <button
                          type="submit"
                          disabled={ctx.demo}
                          className="text-[11px] text-forest underline underline-offset-2 disabled:opacity-40"
                        >
                          {member.checkedInAt ? 'Undo check-in' : 'Check in'}
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              <form action={assignCrew} className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
                <input type="hidden" name="eventId" value={event.id} />
                <Field label="Teammate" htmlFor="crewMember" className="sm:col-span-2">
                  <Select id="crewMember" name="membershipId" required defaultValue="">
                    <option value="" disabled>
                      Choose someone
                    </option>
                    {options.staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Role on the day" htmlFor="crewRole">
                  <Input id="crewRole" name="roleLabel" maxLength={60} placeholder="Counter lead" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From" htmlFor="shiftStart">
                    <Input id="shiftStart" name="shiftStart" type="time" />
                  </Field>
                  <Field label="To" htmlFor="shiftEnd">
                    <Input id="shiftEnd" name="shiftEnd" type="time" />
                  </Field>
                </div>
                <button
                  type="submit"
                  disabled={ctx.demo}
                  className="inline-flex h-10 items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
                >
                  Assign
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shift notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-ink-muted">
              {event.notes ?? 'No notes on this event yet.'}
              <p className="mt-4 text-xs text-ink-muted">
                Employees see this event and their tasks. They never see quote totals, margins or
                client payment history.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === 'money' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotes on this event</CardTitle>
              <Badge tone="outline">{event.quotes.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {event.quotes.length === 0 ? (
                <p className="text-sm text-ink-muted">No quote yet. The composer is where the maths lives.</p>
              ) : (
                event.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2.5 text-sm hover:bg-mint-subtle/60"
                  >
                    <span className="text-ink">{quote.number}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular text-xs text-ink">{formatINR(quote.totalPaise)}</span>
                      <Badge tone="outline">{quote.status}</Badge>
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Quoted</span>
                <span className="tabular text-ink">{formatINR(quoteTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Received</span>
                <span className="tabular text-positive">{formatINR(event.paidPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Costs recorded</span>
                <span className="tabular text-ink">{formatINR(event.expensesPaise)}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-3 font-medium">
                <span className="text-ink">Balance to collect</span>
                <span className="tabular text-forest">{formatINR(balance)}</span>
              </div>
              <Link
                href={`/invoices?event=${event.id}`}
                className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
              >
                Raise an invoice
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
