import { EventCalendar } from '@/components/events/event-calendar'
import { PageHeader } from '@/components/ui/page-header'
import { requireWorkspace } from '@/lib/auth/session'
import { getEventCalendar } from '@/lib/db/events'

export const metadata = { title: 'Event calendar' }

function currentMonth(): string {
  // en-CA produces YYYY-MM. Use IST explicitly: a UTC month is still the
  // previous evening in India, which would open the wrong month on the 1st.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

export default async function EventCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? '') ? params.month! : currentMonth()
  const events = await getEventCalendar(ctx.orgId, ctx.demo, month)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Events by month"
        description="The month grid fetches only the visible range. Click any event to open its run sheet, crew and money."
      />
      <EventCalendar month={month} events={events} />
    </div>
  )
}
