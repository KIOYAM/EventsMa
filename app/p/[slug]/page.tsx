import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Textarea } from '@/components/ui/input'
import { isDatabaseConfigured } from '@/lib/db/client'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { submitEnquiry } from './actions'

export const revalidate = 300

const MESSAGES: Record<string, string> = {
  sent: 'Thank you — your enquiry is with the business. They will reply on the number you gave.',
  contact: 'Please add your name and a 10-digit mobile number.',
  demo: 'Demo mode: enquiries are not delivered until a database is connected.',
  notfound: 'That business could not be found.',
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const demo = !isDatabaseConfigured()
  const profile = demo ? demoPublicProfile() : await getPublicProfile(slug)

  if (!profile) notFound()

  const notice = query.sent ? MESSAGES.sent : query.error ? MESSAGES[query.error] : null
  const isError = Boolean(query.error)

  return (
    <main className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {demo ? (
          <div className="mb-4 rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
            Demo storefront. This is sample data, not a live listing.
          </div>
        ) : null}

        <header className="rounded-card border border-hairline bg-paper p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
            {profile.city ?? 'Service area on request'}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-forest">{profile.name}</h1>
          {profile.tagline ? (
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">{profile.tagline}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.services.map((service) => (
              <Badge key={service.verticalKey} tone="mint">
                {service.label} · {service.itemCount} items
              </Badge>
            ))}
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">What this business provides</h2>
            <div className="space-y-3">
              {profile.services.map((service) => {
                const descriptor = verticalDescriptor(service.verticalKey)
                return (
                  <div key={service.verticalKey} className="rounded-card border border-hairline bg-paper p-4">
                    <p className="text-sm font-medium text-ink">{descriptor.label}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Priced by {descriptor.allowedUnitClasses.length} unit type
                      {descriptor.allowedUnitClasses.length === 1 ? '' : 's'} ·{' '}
                      {service.itemCount} {descriptor.itemNoun}
                      {service.itemCount === 1 ? '' : 's'} in the catalogue
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              Prices are confirmed in a written quotation after the date, guest count and venue are
              known. No lead is promised here — this page exists so a customer can reach this
              business directly.
            </p>
          </section>

          <section className="rounded-card border border-hairline bg-paper p-5">
            <h2 className="text-sm font-semibold text-ink">Ask for a quote</h2>
            <p className="mt-1 text-xs text-ink-muted">
              The business receives this instantly. You will get a reply on the number you provide.
            </p>

            {notice ? (
              <div
                className={
                  isError || query.error
                    ? 'mt-3 rounded-control bg-[#fdf0e2] px-3 py-2 text-xs text-warning'
                    : 'mt-3 rounded-control bg-[#e6f4ea] px-3 py-2 text-xs text-positive'
                }
              >
                {notice}
              </div>
            ) : null}

            <form action={submitEnquiry} className="mt-4 space-y-3">
              <input type="hidden" name="slug" value={profile.slug} />

              <Field label="Your name" htmlFor="name">
                <Input id="name" name="name" required maxLength={120} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile" htmlFor="phone">
                  <Input id="phone" name="phone" inputMode="tel" required placeholder="98420 11452" />
                </Field>
                <Field label="Guests" htmlFor="guests">
                  <Input id="guests" name="guests" inputMode="numeric" defaultValue={250} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Event date" htmlFor="eventDate">
                  <Input id="eventDate" name="eventDate" type="date" />
                </Field>
                <Field label="Occasion" htmlFor="eventType">
                  <Input id="eventType" name="eventType" placeholder="Wedding" maxLength={60} />
                </Field>
              </div>

              <Field label="Anything specific?" htmlFor="message">
                <Textarea id="message" name="message" maxLength={1000} placeholder="Pure veg, banana leaf service, 350 guests." />
              </Field>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
              >
                Send enquiry
              </button>
            </form>
          </section>
        </div>

        <footer className="mt-8 text-center text-xs text-ink-muted">
          {profile.phone ? `Call ${profile.phone} · ` : ''}Powered by EventsMa
        </footer>
      </div>
    </main>
  )
}
