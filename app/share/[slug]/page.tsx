import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Mail, MapPin, MessageCircle, Phone, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getSharePortal } from '@/lib/db/share'
import { shortDate } from '@/lib/utils'
import { PortalForm } from './portal-form'

export const metadata = { title: 'Plan your event' }

export const dynamic = 'force-dynamic'

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const portal = await getSharePortal(slug)

  if (!portal) notFound()

  const event = portal.event
  const waNumber = portal.contact.whatsapp?.replace(/\D/g, '') ?? null

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              Prepared by
            </p>
            <p className="truncate font-display text-lg text-forest">{portal.contact.businessName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {portal.contact.phone ? (
              <a
                href={`tel:${portal.contact.phone.replace(/\s/g, '')}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden /> Call
              </a>
            ) : null}
            {waNumber ? (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
              </a>
            ) : null}
            {portal.contact.email ? (
              <a
                href={`mailto:${portal.contact.email}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden /> Email
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            {event?.eventType ? <Badge tone="mint">{event.eventType}</Badge> : null}
            <Badge tone="outline">Indicative pricing</Badge>
          </div>
          <h1 className="mt-3 font-display text-2xl leading-tight text-forest sm:text-4xl">
            {event?.title ?? `${portal.contact.businessName} services`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Choose the services and items you would like for your event. Nothing is booked or
            charged here — the organiser reviews your choices and sends a confirmed quotation.
          </p>

          {event ? (
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-2 rounded-xl bg-canvas p-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Date</dt>
                  <dd className="mt-0.5 text-ink">{shortDate(event.eventDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-canvas p-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Guests</dt>
                  <dd className="mt-0.5 text-ink">{event.guests || 'To confirm'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-canvas p-3 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Venue</dt>
                  <dd className="mt-0.5 truncate text-ink">
                    {event.venueName ?? 'To be confirmed'}
                    {event.venueAddress ? (
                      <span className="block truncate text-xs text-ink-muted">{event.venueAddress}</span>
                    ) : null}
                  </dd>
                </div>
              </div>
            </dl>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
            {portal.services.map((service) => (
              <span
                key={service.key}
                className="rounded-full border border-hairline px-2.5 py-1"
              >
                {service.label}
              </span>
            ))}
          </div>
        </section>

        <PortalForm portal={portal} />

        <footer className="pb-6 text-center text-[11px] leading-relaxed text-ink-muted">
          <p>
            {portal.contact.businessName}
            {portal.contact.city ? ` · ${portal.contact.city}` : ''}
          </p>
          <p className="mt-1">
            Prices shown are indicative catalogue rates before tax. The organiser confirms the final
            quotation, availability and terms.
          </p>
          <p className="mt-3">
            <Link href="/privacy" className="underline underline-offset-2 hover:text-forest">
              Privacy
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}
