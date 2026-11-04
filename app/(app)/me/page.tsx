import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { requireWorkspace } from '@/lib/auth/session'
import { getAssignedEvents } from '@/lib/db/events'
import { shortDate } from '@/lib/utils'

export const metadata = { title: 'My work' }

export default async function MyWorkPage() {
  const ctx = await requireWorkspace()
  const assignments = await getAssignedEvents(ctx.orgId, ctx.demo, ctx.membershipId)
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = assignments.filter((event) => event.eventDate >= today)
  const openTasks = assignments.reduce((total, event) => total + event.openTasks, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field view"
        title="Your events, nothing else"
        description="A crew member sees the events they are assigned to and the tasks they own. Prices, margins and client contact history stay off this screen."
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Upcoming" value={String(upcoming.length)} hint="Assigned to you" />
        <Stat label="Open tasks" value={String(openTasks)} hint="Across your events" />
        <Stat label="Role" value={ctx.role} hint="Set by an owner" />
      </section>

      {assignments.length === 0 ? (
        <EmptyState
          title="Nothing assigned yet"
          description="When a manager puts you on an event, it appears here with the venue, call time and your tasks."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {assignments.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="rounded-card border border-hairline bg-paper p-4 transition-colors hover:border-forest/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {shortDate(event.eventDate)}
                    {event.venueName ? ` · ${event.venueName}` : ''}
                  </p>
                </div>
                {event.roleLabel ? <Badge tone="mint">{event.roleLabel}</Badge> : null}
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                {event.openTasks === 0
                  ? 'No open tasks'
                  : `${event.openTasks} task${event.openTasks === 1 ? '' : 's'} still open`}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-xs leading-relaxed text-forest">
        Leave requests, wage slips and attendance are not part of this build yet. They need a
        payroll decision first, not a form that quietly records money without a ledger entry.
      </p>
    </div>
  )
}
