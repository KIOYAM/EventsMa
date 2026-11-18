import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PublicNotice } from '@/components/public-notice'
import { StorefrontSection } from '@/components/storefront/public-sections'
import { isDemoEnvironment } from '@/lib/environment'
import { isDatabaseConfigured } from '@/lib/db/client'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { STOREFRONT_LOOK, type StorefrontLook } from '@/lib/domain/storefront-look'
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
 * The closing invitation that sits directly above the form.
 *
 * Kept apart from the Contact section: that one is the owner's phone number and
 * hides when there is none, while this band is the page's one clear ask and is
 * always present.
 */
function ClosingBand({ look }: { look: StorefrontLook }) {
  return (
    <section className="mt-2 px-1">
      <div className={`${look.band} text-center`}>
        <p className={`${look.overline} mx-auto`}>{copy.closing.overline}</p>
        <h2 className={`${look.bandTitle} mx-auto max-w-2xl`}>{copy.closing.title}</h2>
        <p className={`${look.bandMuted} mx-auto`}>{copy.closing.body}</p>
        <a
          href="#enquiry"
          className="mt-6 inline-flex items-center justify-center rounded-control bg-white px-5 py-3 text-sm font-semibold text-[color:var(--brand-ink)] transition hover:bg-white/90"
        >
          {copy.hero.quote}
        </a>
      </div>
    </section>
  )
}

/**
 * The enquiry form. It posts to a server action and owns the honeypot, so it
 * lives here rather than in the section renderer; everything it shows comes from
 * the tenant the page already resolved.
 */
function EnquiryBlock({
  slug,
  heading,
  look,
  phone,
}: {
  slug: string
  heading: string | null
  look: StorefrontLook
  phone: string | null
}) {
  const steps = [copy.enquiry.step1, copy.enquiry.step2, copy.enquiry.step3]

  return (
    <section id="enquiry" aria-labelledby="storefront-enquiry" className={`scroll-mt-6 ${look.section}`}>
      <div className={look.headWrap}>
        <p className={look.overline}>{copy.enquiry.kicker}</p>
        <h2 id="storefront-enquiry" className={look.heading}>
          {heading ?? copy.enquiry.title}
        </h2>
        <div aria-hidden className={look.rule} />
        <p className={look.subhead}>{copy.enquiry.lede}</p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="card-surface p-5 text-ink sm:p-7">
          <Suspense fallback={null}>
            <PublicNotice />
          </Suspense>

          <form action={submitEnquiry} className="space-y-3">
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
        </div>

        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
          {steps.map((step, position) => (
            <li key={step} className={`flex gap-2 text-[11px] leading-relaxed ${look.muted}`}>
              <span className="shrink-0 font-semibold tabular-nums opacity-60">
                {String(position + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {phone ? (
          <p className={`mt-6 text-center text-sm ${look.muted}`}>
            {copy.contact.form}{' '}
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="font-medium underline underline-offset-4"
            >
              {phone}
            </a>
          </p>
        ) : null}
      </div>
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
    <main className={`min-h-dvh scroll-smooth ${look.page}`}>
      <div
        className={`storefront ${look.shell} pt-4 sm:pt-6`}
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
              <>
                <ClosingBand look={look} />
                <EnquiryBlock
                  slug={profile.slug}
                  heading={section.heading}
                  look={look}
                  phone={profile.phone}
                />
              </>
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

        <footer className={look.footer}>
          <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="font-medium">
              {profile.name}
              {profile.city ? ` · ${profile.city}` : ''}
            </p>
            <div className="flex items-center gap-4">
              {profile.phone ? (
                <a href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                  {profile.phone}
                </a>
              ) : null}
              <span className="opacity-70">{copy.footer.poweredBy}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Phone-first visitors should not have to scroll back to act. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 px-3 py-2.5 md:hidden"
        style={{ backgroundColor: 'var(--brand-ink)' }}
      >
        {profile.phone ? (
          <a
            href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`}
            className="flex-1 rounded-pill border border-white/30 py-2.5 text-center text-sm font-medium text-white"
          >
            {copy.facts.call}
          </a>
        ) : null}
        <a
          href="#enquiry"
          className="flex-1 rounded-pill bg-white py-2.5 text-center text-sm font-semibold text-[color:var(--brand-ink)]"
        >
          {copy.hero.quote}
        </a>
      </div>
    </main>
  )
}
