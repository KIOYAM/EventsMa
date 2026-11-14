import Link from 'next/link'
import type { CalendarEvent } from '@/lib/domain/ops'
import { createTranslator } from '@/lib/i18n'
import { localeMeta, type Locale } from '@/lib/i18n/locales'
import { eventStatusKey } from '@/lib/i18n/ops-copy'

/** Monday-first week. Keys, not letters: the label comes from the catalogue. */
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

function shiftMonth(month: string, delta: number): string {
  const [year, value] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year!, value! - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function dayNumber(date: string): number {
  return Number(date.slice(8, 10))
}

/** Month grid. The query is already scoped to the visible month. */
export function EventCalendar({
  month,
  events,
  locale,
}: {
  month: string
  events: CalendarEvent[]
  locale: Locale
}) {
  const t = createTranslator(locale)
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year!, monthIndex! - 1, 1))
  const daysInMonth = new Date(Date.UTC(year!, monthIndex!, 0)).getUTCDate()
  const leading = (first.getUTCDay() + 6) % 7
  const cells = leading + daysInMonth
  const today = new Date().toISOString().slice(0, 10)
  const byDay = new Map<number, CalendarEvent[]>()
  for (const event of events) {
    const day = dayNumber(event.eventDate)
    byDay.set(day, [...(byDay.get(day) ?? []), event])
  }

  // Same month + year shape as before; the month name follows the language.
  const label = new Intl.DateTimeFormat(localeMeta(locale).intl, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(first)

  return (
    <section className="rounded-card border border-hairline bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {t('events.calendar.label')}
          </p>
          <h2 className="mt-0.5 font-display text-xl text-forest">{label}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/events?view=calendar&month=${shiftMonth(month, -1)}`}
            className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-ink"
          >
            {t('events.calendar.previous')}
          </Link>
          <Link
            href={`/events?view=calendar&month=${shiftMonth(month, 1)}`}
            className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-ink"
          >
            {t('events.calendar.next')}
          </Link>
          <Link href="/events" className="text-forest underline underline-offset-4">
            {t('events.calendar.listView')}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-hairline bg-canvas/60 text-center text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-1 py-2">
            {t(`events.calendar.${day}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: cells }).map((_, index) => {
          const day = index - leading + 1
          if (day < 1 || day > daysInMonth) {
            return <div key={`blank-${index}`} className="min-h-24 border-b border-r border-hairline bg-canvas/30 last:border-r-0" />
          }
          const date = `${month}-${String(day).padStart(2, '0')}`
          const dayEvents = byDay.get(day) ?? []
          return (
            <div
              key={date}
              className={`min-h-24 border-b border-r border-hairline p-1.5 last:border-r-0 ${
                date === today ? 'bg-mint-subtle/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs ${date === today ? 'font-semibold text-forest' : 'text-ink-muted'}`}>
                  {day}
                </span>
                {dayEvents.length > 0 ? (
                  <span className="text-[10px] text-ink-muted">{dayEvents.length}</span>
                ) : null}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block truncate rounded bg-mint-subtle px-1.5 py-1 text-[10px] leading-tight text-forest hover:bg-mint"
                    title={t('events.calendar.tooltip', {
                      title: event.title,
                      status: t(eventStatusKey(event.status)),
                      guests: event.guests,
                    })}
                  >
                    {event.title}
                  </Link>
                ))}
                {dayEvents.length > 2 ? (
                  <p className="px-1 text-[10px] text-ink-muted">
                    {t('events.calendar.more', { count: dayEvents.length - 2 })}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
