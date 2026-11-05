import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PublicNotice } from '@/components/public-notice'
import { isDemoEnvironment } from '@/lib/environment'
import { isDatabaseConfigured } from '@/lib/db/client'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { submitEnquiry } from './actions'

export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (isDemoEnvironment()) return [{ slug: demoPublicProfile().slug }]
  if (!isDatabaseConfigured()) return []
  try {
    const { getDb } = await import('@/lib/db/client')
    const { businesses, organisations } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const rows = await getDb()
      .select({ slug: organisations.slug })
      .from(businesses)
      .innerJoin(organisations, eq(businesses.orgId, organisations.id))
      .where(eq(businesses.published, true))
      .limit(1000)
    return rows
  } catch {
    // A build-time database hiccup must not block the deploy. The route falls
    // back to on-demand rendering and caches the result for 5 minutes.
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = isDemoEnvironment() ? demoPublicProfile() : await getPublicProfile(slug)
  if (!profile) return { title: 'Business not found', robots: { index: false, follow: false } }

  const description =
    profile.tagline ??
    `${profile.name} in ${profile.city ?? 'India'} - event services, menus and enquiries.`

  return {
    title: profile.name,
    description,
    alternates: { canonical: `/p/${profile.slug}` },
    openGraph: {
      type: 'website',
      title: profile.name,
      description,
      url: `/p/${profile.slug}`,
    },
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const demo = isDemoEnvironment()
  const profile = demo ? demoPublicProfile() : await getPublicProfile(slug)

  if (!profile) notFound()

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
                {service.label} - {service.itemCount} items
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
                      {descriptor.allowedUnitClasses.length === 1 ? '' : 's'} -{' '}
                      {service.itemCount} {descriptor.itemNoun}
                      {service.itemCount === 1 ? '' : 's'} in the catalogue
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              Prices are confirmed in a written quotation after the date, guest count and venue are
              known. No lead is promised here - this page exists so a customer can reach this
              business directly.
            </p>
          </section>

          <section className="rounded-card border border-hairline bg-paper p-5">
            <h2 className="text-sm font-semibold text-ink">Ask for a quote</h2>
            <p className="mt-1 text-xs text-ink-muted">
              The business receives this instantly. You will get a reply on the number you provide.
            </p>

            <Suspense fallback={null}>
              <PublicNotice />
            </Suspense>

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
                <Textarea
                  id="message"
                  name="message"
                  maxLength={1000}
                  placeholder="Pure veg, banana leaf service, 350 guests."
                />
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
          {profile.phone ? `Call ${profile.phone} - ` : ''}Powered by EventsMa
        </footer>
      </div>
    </main>
  )
}
