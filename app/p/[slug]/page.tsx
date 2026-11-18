import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PublicNotice } from '@/components/public-notice'
import { StorefrontSection } from '@/components/storefront/public-sections'
import { isDemoEnvironment } from '@/lib/environment'
import { isDatabaseConfigured } from '@/lib/db/client'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { STOREFRONT_LOOK } from '@/lib/domain/storefront-look'
import { storefrontPublic as copy } from '@/lib/i18n/messages/en/storefront-public'
import { submitEnquiry } from './actions'

export const revalidate = 300
export const dynamicParams = true

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

/**
 * The enquiry form. Kept here rather than in the section renderer because it
 * posts to a server action and owns the honeypot; everything it shows comes from
 * the tenant the page already resolved.
 */
function EnquiryBlock({
  slug,
  heading,
}: {
  slug: string
  heading: string | null
}) {
  return (
    <section className="card-surface max-w-2xl p-5">
      <h2 className="text-sm font-semibold text-ink">{heading ?? copy.enquiry.title}</h2>
      <p className="mt-1 text-xs text-ink-muted">
        The business receives this instantly. You will get a reply on the number you provide.
      </p>

      <Suspense fallback={null}>
        <PublicNotice />
      </Suspense>

      <form action={submitEnquiry} className="mt-4 space-y-3">
        <input type="hidden" name="slug" value={slug} />
        {/* Honeypot: hidden from people, tempting to form-filling bots. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Field label={copy.enquiry.form.name} htmlFor="name">
          <Input id="name" name="name" required maxLength={120} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={copy.enquiry.form.mobile} htmlFor="phone">
            <Input id="phone" name="phone" inputMode="tel" required placeholder="98420 11452" />
          </Field>
          <Field label={copy.enquiry.form.guests} htmlFor="guests">
            <Input id="guests" name="guests" inputMode="numeric" defaultValue={250} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={copy.enquiry.form.date} htmlFor="eventDate">
            <Input id="eventDate" name="eventDate" type="date" />
          </Field>
          <Field label={copy.enquiry.form.occasion} htmlFor="eventType">
            <Input
              id="eventType"
              name="eventType"
              placeholder={copy.enquiry.form.occasionPlaceholder}
              maxLength={60}
            />
          </Field>
        </div>

        <Field label={copy.enquiry.form.message} htmlFor="message">
          <Textarea
            id="message"
            name="message"
            maxLength={1000}
            placeholder={copy.enquiry.form.messagePlaceholder}
          />
        </Field>

        <button
          type="submit"
          className="btn btn-md w-full text-white"
          style={{ backgroundColor: 'var(--brand-ink)' }}
        >
          {copy.enquiry.form.submit}
        </button>
      </form>
    </section>
  )
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const demo = isDemoEnvironment()
  const profile = demo ? demoPublicProfile() : await getPublicProfile(slug)

  if (!profile) notFound()

  const look = STOREFRONT_LOOK[profile.theme]

  // Hiding every section must not ship a blank page: the opening block returns.
  const sections =
    profile.sections.length > 0
      ? profile.sections
      : [{ key: 'hero' as const, heading: null, imageUrl: null, config: { faq: [], team: [] } }]

  // The About section owns the introduction once it is on the page; the hero only
  // repeats it when the owner has hidden that section.
  const hideHeroAbout = sections.some((section) => section.key === 'about')

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
          <div key={section.key} className="reveal" style={{ animationDelay: `${index * 70}ms` }}>
            {section.key === 'enquiry' ? (
              <div className={index === 0 ? '' : look.section}>
                <EnquiryBlock slug={profile.slug} heading={section.heading} />
              </div>
            ) : (
              <StorefrontSection
                section={section}
                index={index}
                look={look}
                profile={profile}
                hideHeroAbout={hideHeroAbout}
              />
            )}
          </div>
        ))}

        <footer className="mt-8 text-center text-xs text-ink-muted">
          {profile.phone ? `Call ${profile.phone} - ` : ''}Powered by EventsMa
        </footer>
      </div>
    </main>
  )
}
