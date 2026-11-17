import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PublicNotice } from '@/components/public-notice'
import { isDemoEnvironment } from '@/lib/environment'
import { isDatabaseConfigured } from '@/lib/db/client'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { pluralise } from '@/lib/domain/plural'
import { fontClass } from '@/lib/domain/storefront'
import { submitEnquiry } from './actions'

export const revalidate = 300
export const dynamicParams = true

/**
 * Three layouts, one markup tree.
 *
 * Each entry only changes rhythm and surface: spacing, type scale, whether a
 * service is a card or a ruled row, and whether the hero photo sits behind the
 * name or above it. Colours stay in tokens; the tenant's own brand colour is
 * applied as `--brand` on the wrapper and darkened into `--brand-ink` by CSS.
 */
const LOOK = {
  editorial: {
    page: 'bg-canvas',
    hero: 'card-surface overflow-hidden',
    heroBody: 'p-6 sm:p-10',
    eyebrow: 'text-xs font-medium uppercase tracking-[0.14em] text-ink-muted',
    title: 'mt-2 text-4xl leading-[1.05] text-forest sm:text-5xl',
    lede: 'mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base',
    section: 'mt-10',
    heading: 'text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted',
    grid: 'mt-4 grid gap-3 sm:grid-cols-2',
    card: 'card-surface lift p-4',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'shrink-0 text-xs text-ink-muted',
    image: 'aspect-[21/9] w-full object-cover',
  },
  ledger: {
    page: 'bg-paper',
    hero: 'border-y border-hairline',
    heroBody: 'py-6 sm:py-8',
    eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted',
    title: 'mt-1 text-3xl leading-tight text-forest sm:text-4xl',
    lede: 'mt-2 max-w-2xl text-sm text-ink-muted',
    section: 'mt-8 border-t border-hairline pt-5',
    heading: 'text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted',
    grid: 'mt-3 divide-y divide-hairline',
    card: 'flex flex-wrap items-baseline justify-between gap-2 py-3',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'shrink-0 text-xs text-ink-muted',
    image: 'aspect-[3/1] w-full object-cover',
  },
  gallery: {
    page: 'bg-canvas',
    hero: 'relative overflow-hidden rounded-card bg-forest text-white',
    heroBody: 'relative p-8 sm:p-12',
    eyebrow: 'text-xs font-medium uppercase tracking-[0.16em] text-white/80',
    title: 'mt-2 text-4xl leading-[1.05] sm:text-5xl',
    lede: 'mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base',
    section: 'mt-8',
    heading: 'text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted',
    grid: 'mt-4 grid gap-3 sm:grid-cols-2',
    card: 'card-surface lift overflow-hidden',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'shrink-0 text-xs text-ink-muted',
    image: 'absolute inset-0 h-full w-full object-cover opacity-85',
  },
} as const

/** Initials wordmark, used when no logo image is uploaded. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (isDemoEnvironment()) return [{ slug: demoPublicProfile().slug }]
  if (!isDatabaseConfigured()) return []
  try {
    // Build-time public listing: there is no request identity to scope.
    const { getSystemDb } = await import('@/lib/db/client')
    const { businesses, organisations } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const rows = await getSystemDb()
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

  const look = LOOK[profile.theme]
  const onImage = profile.theme === 'gallery'

  // Hiding every section must not ship a blank page: the opening block returns.
  const sections =
    profile.sections.length > 0
      ? profile.sections
      : [{ key: 'hero' as const, heading: null, imageUrl: null }]

  return (
    <main className={`min-h-dvh ${look.page}`}>
      <div
        className="storefront mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"
        style={{ '--brand': profile.brandPrimary } as React.CSSProperties}
      >
        {demo ? (
          <div className="mb-4 card-flat bg-mint-subtle px-4 py-3 text-sm text-forest">
            Demo storefront. This is sample data, not a live listing.
          </div>
        ) : null}

        {sections.map((section, index) => (
          <div
            key={section.key}
            className="reveal"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {section.key === 'hero' ? (
              <header className={`${look.hero} ${index === 0 ? '' : 'mt-6'}`}>
                {section.imageUrl ? (
                  <img src={section.imageUrl} alt="" className={look.image} />
                ) : null}
                {onImage && section.imageUrl ? (
                  <div aria-hidden className="absolute inset-0 bg-forest/55" />
                ) : null}
                <div className={look.heroBody}>
                  <p className={look.eyebrow}>{profile.city ?? 'Service area on request'}</p>
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={`${profile.name} logo`}
                      className="mt-3 h-12 w-auto max-w-[180px] object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="mt-3 grid h-11 w-11 place-items-center rounded-card border border-hairline bg-paper/10 text-sm font-semibold"
                      style={{ color: onImage ? undefined : 'var(--brand-ink)' }}
                    >
                      {initials(profile.name)}
                    </span>
                  )}
                  <h1 className={`${look.title} ${fontClass(profile.brandFont)}`}>
                    {profile.name}
                  </h1>
                  {profile.brandSubtitle ? (
                    <p className={`${look.eyebrow} mt-2`}>{profile.brandSubtitle}</p>
                  ) : null}
                  {(section.heading ?? profile.tagline) ? (
                    <p className={look.lede}>{section.heading ?? profile.tagline}</p>
                  ) : null}
                  {profile.about ? (
                    <p className={`${look.lede} mt-2`}>{profile.about}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.services.map((service) => (
                      <Badge key={service.verticalKey} tone="mint">
                        {service.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </header>
            ) : null}

            {section.key === 'services' ? (
              <section aria-labelledby="storefront-services" className={index === 0 ? '' : look.section}>
                <div
                  aria-hidden
                  className="mb-2 h-0.5 w-8 rounded-pill"
                  style={{ backgroundColor: 'var(--brand)' }}
                />
                <h2 id="storefront-services" className={look.heading}>
                  {section.heading ?? 'What this business provides'}
                </h2>
                <div className={look.grid}>
                  {profile.services.map((service) => (
                    <div key={service.verticalKey} className={look.card}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className={look.cardTitle}>{service.label}</p>
                        <p className={look.count}>
                          {service.itemCount > 0
                            ? `${service.itemCount} ${pluralise(service.itemNoun, service.itemCount)}`
                            : 'Catalogue on request'}
                        </p>
                      </div>
                      {service.items.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {service.items.map((item) => (
                            <li
                              key={item.id}
                              className="rounded-pill border border-hairline px-2 py-0.5 text-xs text-ink-muted"
                            >
                              {item.name} · {item.unit}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                  Prices are confirmed in a written quotation after the date, guest count and venue
                  are known. No lead is promised here - this page exists so a customer can reach
                  this business directly.
                </p>
              </section>
            ) : null}

            {section.key === 'gallery' && profile.portfolio.length > 0 ? (
              <section aria-labelledby="storefront-work" className={index === 0 ? '' : look.section}>
                <div
                  aria-hidden
                  className="mb-2 h-0.5 w-8 rounded-pill"
                  style={{ backgroundColor: 'var(--brand)' }}
                />
                <h2 id="storefront-work" className={look.heading}>
                  {section.heading ?? 'Recent work'}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.portfolio.map((item) => (
                    <figure key={item.id} className="card-surface lift overflow-hidden">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.title}
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : null}
                      <figcaption className="p-3">
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {[item.eventDate, item.venueName].filter(Boolean).join(' · ')}
                        </p>
                        {item.description ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                            {item.description}
                          </p>
                        ) : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {section.key === 'enquiry' ? (
              <section
                className={`card-surface max-w-2xl p-5 ${index === 0 ? '' : look.section}`}
              >
                <h2 className="text-sm font-semibold text-ink">
                  {section.heading ?? 'Ask for a quote'}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  The business receives this instantly. You will get a reply on the number you
                  provide.
                </p>

                <Suspense fallback={null}>
                  <PublicNotice />
                </Suspense>

                <form action={submitEnquiry} className="mt-4 space-y-3">
                  <input type="hidden" name="slug" value={profile.slug} />
                  {/* Honeypot: hidden from people, tempting to form-filling bots. */}
                  <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

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
                    className="btn btn-md w-full text-white"
                    style={{ backgroundColor: 'var(--brand-ink)' }}
                  >
                    Send enquiry
                  </button>
                </form>
              </section>
            ) : null}
          </div>
        ))}

        <footer className="mt-8 text-center text-xs text-ink-muted">
          {profile.phone ? `Call ${profile.phone} - ` : ''}Powered by EventsMa
        </footer>
      </div>
    </main>
  )
}
