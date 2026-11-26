import { Suspense } from 'react'
import type { PublicProfile } from '@/lib/db/public'
import { emptySectionConfig } from '@/lib/domain/storefront'
import { STOREFRONT_LOOK, type StorefrontLook } from '@/lib/domain/storefront-look'
import { appUrl } from '@/lib/app-url'
import { storefrontPublic as copy } from '@/lib/i18n/messages/en/storefront-public'
import {
  designStyle,
  instagramUrl,
  surfaceClass,
  whatsappUrl,
} from '@/lib/domain/storefront-design'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PublicNotice } from '@/components/public-notice'
import { StorefrontSection } from '@/components/storefront/public-sections'
import { EnquiryAttribution } from '@/components/storefront/enquiry-attribution'
import { StorefrontViewBeacon } from '@/components/storefront/view-beacon'
import { submitEnquiry } from '@/app/p/[slug]/actions'

/**
 * The page a visitor reads, and the page its owner previews.
 *
 * One component serves both so a preview cannot drift from production: the only
 * difference is `preview`, which disables the enquiry form (a preview must never
 * write a lead) and skips the visitor-facing demo banner. Structured data is
 * emitted only for the real page, where a crawler can actually reach it.
 */
export function StorefrontPublicPage({
  profile,
  demo,
  preview = false,
  shared = false,
}: {
  profile: PublicProfile
  demo: boolean
  preview?: boolean
  /** A client's token link: same draft, but no editor affordances. */
  shared?: boolean
}) {
  const look = STOREFRONT_LOOK[profile.theme]
  const design = profile.design
  // One label for every place the page asks for a quote, so an owner can call it
  // a booking, an enquiry or a site visit without editing three components.
  const cta = design.ctaLabel ?? copy.hero.quote
  // Dial-safe: display keeps the owner's spacing, the link does not.
  const tel = profile.phone?.replace(/[^\d+]/g, '') ?? null
  const channels = [
    design.whatsapp ? { label: copy.channels.whatsapp, href: whatsappUrl(design.whatsapp) } : null,
    design.instagram
      ? { label: `@${design.instagram}`, href: instagramUrl(design.instagram) }
      : null,
    design.email ? { label: copy.channels.email, href: `mailto:${design.email}` } : null,
  ].filter((channel): channel is { label: string; href: string } => channel !== null)

  // Hiding every section must not ship a blank page: the opening block returns.
  const sections =
    profile.sections.length > 0
      ? profile.sections
      : [
          { key: 'hero' as const, heading: null, imageUrl: null, config: emptySectionConfig() },
        ]

  // The About section owns the introduction once it is on the page; the hero only
  // repeats it when the owner has hidden that section.
  const hideHeroAbout = sections.some((section) => section.key === 'about')

  return (
    <main className={`min-h-dvh scroll-smooth ${surfaceClass(design, look.page)}`}>
      {/* Draft previews and the demo must never write analytics. */}
      {!preview && !demo ? <StorefrontViewBeacon slug={profile.slug} /> : null}
      {preview ? <PreviewBar slug={profile.slug} shared={shared} /> : null}

      <div
        className={`storefront ${look.shell} pt-4 sm:pt-6`}
        style={
          { '--brand': profile.brandPrimary, ...designStyle(design, profile.theme) } as React.CSSProperties
        }
      >
        {design.announcement ? (
          <p
            className="mb-4 rounded-control px-4 py-2 text-center text-xs font-medium tracking-wide text-white"
            style={{ backgroundColor: 'var(--brand-ink)' }}
          >
            {design.announcement}
          </p>
        ) : null}

        {demo && !preview ? (
          <div className="mb-4 card-flat bg-mint-subtle px-4 py-3 text-sm text-forest">
            Demo storefront. This is sample data, not a live listing.
          </div>
        ) : null}

        {sections.map((section, index) => (
          <div key={section.key} className="reveal" style={{ animationDelay: `${index * 70}ms` }}>
            {section.key === 'enquiry' ? (
              <>
                <ClosingBand look={look} cta={cta} />
                <EnquiryBlock
                  slug={profile.slug}
                  heading={section.heading}
                  look={look}
                  phone={profile.phone}
                  preview={preview}
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
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
              {profile.phone && tel ? (
                <a href={`tel:${tel}`} className="hover:underline">
                  {profile.phone}
                </a>
              ) : null}
              {channels.map((channel) => (
                <a
                  key={channel.href}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {channel.label}
                </a>
              ))}
              <span className="opacity-70">{copy.footer.poweredBy}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Phone-first visitors should not have to scroll back to act. */}
      <div
        data-landing="mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 px-3 py-2.5 md:hidden"
        style={{ backgroundColor: 'var(--brand-ink)' }}
      >
        {profile.phone && tel ? (
          <a
            href={`tel:${tel}`}
            className="flex-1 rounded-pill border border-white/30 py-2.5 text-center text-sm font-medium text-white"
          >
            {copy.facts.call}
          </a>
        ) : null}
        <a
          href="#enquiry"
          className="flex-1 rounded-pill bg-white py-2.5 text-center text-sm font-semibold text-[color:var(--brand-ink)]"
        >
          {cta}
        </a>
      </div>

      {!preview ? <StorefrontStructuredData profile={profile} /> : null}
    </main>
  )
}

/** The pinned strip above a draft: editor shortcuts for the owner, honesty for a client. */
function PreviewBar({ slug, shared }: { slug: string; shared?: boolean }) {
  const label = shared ? copy.preview.sharedLabel : copy.preview.label
  const note = shared ? copy.preview.sharedNote : copy.preview.note
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-2 text-center text-xs text-white">
      <span className="font-semibold">{label}</span>
      <span className="text-white/70">{note}</span>
      {shared ? null : (
        <>
          <a href="/storefront/customise" className="underline underline-offset-4">
            {copy.preview.back}
          </a>
          <a href={`/p/${slug}`} className="underline underline-offset-4" target="_blank" rel="noreferrer">
            {copy.preview.published}
          </a>
        </>
      )}
    </div>
  )
}

/**
 * `LocalBusiness`, emitted from the same DTO the page renders.
 *
 * Prices are deliberately absent: the catalogue is indicative, and marking up a
 * rate that a quotation may change would be a claim the business did not make.
 */
function StorefrontStructuredData({ profile }: { profile: PublicProfile }) {
  const base = appUrl()
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.name,
    ...(profile.tagline ? { description: profile.tagline } : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.city
      ? { address: { '@type': 'PostalAddress', addressLocality: profile.city, addressCountry: 'IN' } }
      : {}),
    // A stable public card, not the signed logo URL: that link expires in a day and
    // a crawler may read this payload much later.
    image: `${base}/p/${profile.slug}/opengraph-image`,
    url: `${base}/p/${profile.slug}`,
    ...(profile.services.length > 0
      ? {
          makesOffer: profile.services.map((service) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: service.label },
          })),
        }
      : {}),
  }

  // JSON.stringify does not escape `<`, so an owner typing `</script>` into their
  // business name would end this tag early. Escaping it keeps the payload valid
  // JSON and is the only character that can break out of a script element.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

/**
 * The closing invitation that sits directly above the form.
 *
 * Kept apart from the Contact section: that one is the owner's phone number and
 * hides when there is none, while this band is the page's one clear ask and is
 * always present.
 */
function ClosingBand({ look, cta }: { look: StorefrontLook; cta: string }) {
  return (
    <section data-landing="closing" className="mt-2 px-1">
      <div className={`${look.band} text-center`}>
        <p className={`${look.overline} mx-auto`}>{copy.closing.overline}</p>
        <h2 className={`${look.bandTitle} mx-auto max-w-2xl`}>{copy.closing.title}</h2>
        <p className={`${look.bandMuted} mx-auto`}>{copy.closing.body}</p>
        <a
          href="#enquiry"
          className="mt-6 inline-flex items-center justify-center rounded-control bg-white px-5 py-3 text-sm font-semibold text-[color:var(--brand-ink)] transition hover:bg-white/90"
        >
          {cta}
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
  preview,
}: {
  slug: string
  heading: string | null
  look: StorefrontLook
  phone: string | null
  preview: boolean
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

          {preview ? (
            <p className="mb-4 rounded-control bg-mint-subtle px-3 py-2 text-sm text-forest">
              {copy.preview.formOff}
            </p>
          ) : null}

          <form action={submitEnquiry} className="space-y-3">
            <input type="hidden" name="slug" value={slug} />
            <EnquiryAttribution />
            {/* Honeypot: hidden from people, tempting to form-filling bots. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <fieldset disabled={preview} className="space-y-3 disabled:opacity-70">
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
            </fieldset>
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
