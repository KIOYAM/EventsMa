import { EventCalendar } from '@/components/events/event-calendar'
import { PageHeader } from '@/components/ui/page-header'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEventCalendar } from '@/lib/db/events'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('events.calendar.title') }
}

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
  const locale = await getLocale()
  const t = translatorFor(locale)
  const params = await searchParams
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? '') ? params.month! : currentMonth()
  const events = await withWorkspace(ctx, () => getEventCalendar(ctx.orgId, ctx.demo, month))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('events.calendar.eyebrow')}
        title={t('events.calendar.heading')}
        description={t('events.calendar.intro')}
      />
      <EventCalendar month={month} events={events} locale={locale} />
    </div>
  )
}
