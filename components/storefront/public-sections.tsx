import { pluralise } from '@/lib/domain/plural'
import { fontClass } from '@/lib/domain/storefront'
import type { StorefrontLook } from '@/lib/domain/storefront-look'
import type { PublicProfile, PublicSection } from '@/lib/db/public'
import { storefrontPublic as copy } from '@/lib/i18n/messages/en/storefront-public'

/** Initials wordmark, used when no logo image is uploaded. */
function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .slice(0, 2)
  if (words.length === 0) return '·'
  return words.map((word) => word[0]?.toUpperCase() ?? '').join('')
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  )
}

/**
 * The picture area of a card when the tenant has no photograph.
 *
 * A business on its first day has no uploads, and an empty grey box reads worse
 * than no picture at all. This paints the owner's own colour into a soft, unique
 * surface and sets the item's initials on it — decoration, not a claim about the
 * food, the venue or the work.
 */
function Artwork({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden ${tall ? 'aspect-[16/10]' : 'aspect-[16/9]'}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 22% 24%, color-mix(in srgb, var(--brand) 26%, #ffffff) 0%, transparent 62%), linear-gradient(135deg, color-mix(in srgb, var(--brand) 14%, #f6f8f6) 0%, color-mix(in srgb, var(--brand) 52%, #dfe9e1) 100%)',
      }}
    >
      <span className="absolute inset-0 grid place-items-center text-3xl font-semibold text-[color:var(--brand-ink)]/25">
        {initials(label)}
      </span>
    </div>
  )
}

/** A section's opening, in the centred editorial rhythm of the page. */
function SectionHead({
  look,
  overline,
  title,
  sub,
  align = 'center',
}: {
  look: StorefrontLook
  overline: string
  title: string
  sub?: string | null
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? look.headWrap : look.headLeft}>
      <p className={look.overline}>{overline}</p>
      <h2 className={look.heading}>{title}</h2>
      <div aria-hidden className={look.rule} />
      {sub ? <p className={look.subhead}>{sub}</p> : null}
    </div>
  )
}

interface SectionProps {
  section: PublicSection
  index: number
  look: StorefrontLook
  profile: PublicProfile
  /** The About section is visible, so the opening block leaves that text to it. */
  hideHeroAbout: boolean
}

/**
 * One published section.
 *
 * Every branch renders nothing when the tenant has no data for it: a heading over
 * an empty list is worse than no section, and a storefront must never imply an
 * offer it cannot name. The enquiry form is the one exception — it lives in the
 * page, because it posts to a server action rather than reading content.
 *
 * What a branch may *not* do is look unfinished. A business with one service, no
 * photographs and no introduction is the common case on day one, so every card
 * carries its own artwork, the sections announce themselves the same way, and
 * the page still reads as one designed piece.
 */
export function StorefrontSection({
  section,
  index,
  look,
  profile,
  hideHeroAbout,
}: SectionProps) {
  const top = index === 0
  const tel = profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, '')}` : null
  // Two entries per service rather than the first six rows overall: a business
  // that also decorates, photographs and does makeup should not show six drinks
  // and nothing else.
  const dishes = profile.services
    .flatMap((service) =>
      service.items.slice(0, 2).map((item) => ({ ...item, serviceLabel: service.label })),
    )
    .slice(0, 8)

  if (section.key === 'hero') {
    const lede =
      section.heading ??
      profile.tagline ??
      (hideHeroAbout ? profile.about : null) ??
      copy.hero.lede

    return (
      <header id="top" className={`${look.hero} ${top ? '' : 'mt-6'}`}>
        {section.imageUrl ? (
          <>
            <img src={section.imageUrl} alt="" className={look.heroPhoto} />
            <div aria-hidden className={look.heroShade} />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                look.heroTone === 'dark'
                  ? 'linear-gradient(105deg, var(--brand-ink) 0%, color-mix(in srgb, var(--brand) 45%, #071b14) 65%, color-mix(in srgb, var(--brand) 30%, #071b14) 100%)'
                  : 'linear-gradient(105deg, color-mix(in srgb, var(--brand) 8%, #ffffff) 0%, color-mix(in srgb, var(--brand) 26%, #f6f8f6) 100%)',
            }}
          />
        )}

        {/* The wordmark, oversized and almost invisible: an object to look at when
            there is no photograph, without competing with the name. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -right-4 -bottom-16 select-none text-[12rem] leading-none font-semibold sm:text-[18rem] ${
            look.heroTone === 'dark' ? 'text-white/[0.06]' : 'text-forest/[0.05]'
          }`}
        >
          {initials(profile.name)}
        </span>

        <div className={look.heroBody}>
          <p className={look.overline}>
            {[profile.city ?? copy.serviceArea, profile.services.map((s) => s.label).join(' · ')]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <div className="mt-5 flex items-center gap-3">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={`${profile.name} logo`}
                className="h-12 w-auto max-w-[180px] object-contain"
              />
            ) : (
              <span
                aria-hidden
                className={`grid h-11 w-11 place-items-center rounded-card border text-sm font-semibold ${
                  look.heroTone === 'dark' ? 'border-white/30 text-white/80' : 'border-forest/20 text-forest'
                }`}
              >
                {initials(profile.name)}
              </span>
            )}
            {profile.brandSubtitle ? (
              <p className="text-[11px] tracking-[0.16em] uppercase opacity-75">
                {profile.brandSubtitle}
              </p>
            ) : null}
          </div>

          <h1 className={`${look.title} ${fontClass(profile.brandFont)}`}>{profile.name}</h1>
          {lede ? <p className={look.lede}>{lede}</p> : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#enquiry" className={look.ctaPrimary}>
              {copy.hero.quote}
            </a>
            {tel ? (
              <a href={tel} className={look.ctaGhost}>
                {fill(copy.hero.call, { phone: profile.phone ?? '' })}
              </a>
            ) : (
              <a href="#services" className={look.ctaGhost}>
                {copy.hero.services}
              </a>
            )}
          </div>
        </div>
      </header>
    )
  }

  if (section.key === 'about') {
    if (!profile.about) return null
    return (
      <section aria-labelledby="storefront-about" className={look.section}>
        <SectionHead
          look={look}
          overline={copy.about.overline}
          title={section.heading ?? fill(copy.about.title, { business: profile.name })}
        />
        <p
          className={`mx-auto mt-6 max-w-2xl text-sm leading-[1.9] whitespace-pre-line sm:text-base ${look.muted}`}
          style={{ textAlign: 'center' }}
        >
          {profile.about}
        </p>
      </section>
    )
  }

  if (section.key === 'services') {
    if (profile.services.length === 0) return null
    return (
      <section id="services" aria-labelledby="storefront-services" className={look.section}>
        <SectionHead
          look={look}
          overline={copy.services.overline}
          title={section.heading ?? copy.services.title}
          sub={copy.services.lede}
        />

        <div className={look.grid}>
          {profile.services.map((service) => (
            <article key={service.verticalKey} className={look.card}>
              <Artwork label={service.label} />
              <div className={look.cardBody}>
                <h3 className={look.cardTitle}>{service.label}</h3>
                <p className={`mt-1.5 text-xs ${look.muted}`}>
                  {service.itemCount > 0
                    ? `${service.itemCount} ${pluralise(service.itemNoun, service.itemCount)} on the catalogue`
                    : copy.services.empty}
                </p>
                {service.itemCount > 0 ? (
                  <a
                    href={`/p/${profile.slug}/services/${service.verticalKey}`}
                    className={`mt-3 ${look.link}`}
                  >
                    View all {service.itemCount} {pluralise(service.itemNoun, service.itemCount)}
                  </a>
                ) : null}
                <a href="#enquiry" className={`mt-3 ${look.link}`}>
                  {copy.services.ask}
                </a>
              </div>
            </article>
          ))}
        </div>

        {dishes.length > 0 ? (
          <>
            <div className="mt-14">
              <SectionHead
                look={look}
                overline={copy.dishes.overline}
                title={copy.dishes.title}
                sub={copy.dishes.lede}
              />
            </div>
            <div className={look.gridWide}>
              {dishes.map((item) => (
                <article key={item.id} className={look.card}>
                  <div className={look.cardBody}>
                    <p className={look.count}>{item.serviceLabel}</p>
                    <h3 className={`mt-1.5 ${look.cardTitle}`}>
                      <a href={`/p/${profile.slug}/services/${item.id}`} className="hover:underline">
                        {item.name}
                      </a>
                    </h3>
                    <p className={`mt-1 text-xs ${look.muted}`}>{item.unit}</p>
                    <a href="#enquiry" className={`mt-3 ${look.link}`}>
                      {copy.dishes.ask}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        <p className={`mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed ${look.muted}`}>
          {copy.services.note}
        </p>
      </section>
    )
  }

  if (section.key === 'packages') {
    if (profile.packages.length === 0) return null
    return (
      <section id="menus" aria-labelledby="storefront-packages" className={look.section}>
        <SectionHead
          look={look}
          overline={copy.packages.overline}
          title={section.heading ?? copy.packages.title}
          sub={copy.packages.lede}
        />
        <div className={look.gridWide}>
          {profile.packages.map((pkg) => (
            <article key={pkg.id} className={look.card}>
              <Artwork label={pkg.name} tall />
              <div className={look.cardBody}>
                <p className={look.count}>
                  {pkg.serviceLabel} · {pkg.unit}
                </p>
                <h3 className={`mt-1.5 ${look.cardTitle}`}>{pkg.name}</h3>
                {pkg.inclusions.length > 0 ? (
                  <p className={`mt-2 text-xs leading-relaxed ${look.muted}`}>
                    {pkg.inclusions.join(' · ')}
                  </p>
                ) : null}
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className={look.price}>{pkg.rate ?? copy.packages.onRequest}</p>
                    {pkg.minQuantity ? (
                      <p className={`mt-1 text-[11px] ${look.muted}`}>
                        {fill(copy.packages.minimum, { n: String(pkg.minQuantity) })}
                      </p>
                    ) : null}
                  </div>
                  <a href="#enquiry" className={look.link}>
                    {copy.packages.ask}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'gallery') {
    if (profile.portfolio.length === 0) return null
    return (
      <section id="work" aria-labelledby="storefront-work" className={look.section}>
        <SectionHead
          look={look}
          overline={copy.gallery.overline}
          title={section.heading ?? copy.gallery.title}
          sub={copy.gallery.lede}
        />
        <div className="mt-9 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:grid-cols-3">
          {profile.portfolio.map((item, position) => (
            <figure
              key={item.id}
              className={`${look.tile} ${position === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <Artwork label={item.title} />
              )}
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 to-transparent p-4 text-white">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-white/75">
                  {[item.eventDate, item.venueName].filter(Boolean).join(' · ')}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'testimonials') {
    if (section.config.testimonials.length === 0) return null
    return (
      <section
        id="testimonials"
        aria-labelledby="storefront-testimonials"
        className={look.section}
      >
        <SectionHead
          look={look}
          overline={copy.testimonials.overline}
          title={section.heading ?? copy.testimonials.title}
          sub={copy.testimonials.lede}
        />
        <div className={look.gridWide}>
          {section.config.testimonials.map((item) => (
            <figure key={item.id} className={look.card}>
              <div className={look.cardBody}>
                <span
                  aria-hidden
                  className="block text-4xl leading-none opacity-25"
                  style={{ color: 'var(--brand)' }}
                >
                  &ldquo;
                </span>
                <blockquote className={`mt-1 text-sm leading-[1.85] ${look.muted}`}>
                  {item.quote}
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-pill text-[11px] font-semibold text-white"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {initials(item.name || profile.name)}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{item.name || profile.name}</span>
                    {item.context ? (
                      <span className={`block text-[11px] ${look.muted}`}>{item.context}</span>
                    ) : null}
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'team') {
    if (section.config.team.length === 0) return null
    return (
      <section id="team" aria-labelledby="storefront-team" className={look.section}>
        <SectionHead
          look={look}
          overline={copy.team.overline}
          title={section.heading ?? copy.team.title}
        />
        <div className={look.gridWide}>
          {section.config.team.map((member) => (
            <div key={member.id} className={look.card}>
              <div className={`flex items-center gap-3 ${look.cardBody}`}>
                <span
                  aria-hidden
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-pill text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {initials(member.name)}
                </span>
                <div>
                  <p className={look.cardTitle}>{member.name}</p>
                  {member.role ? <p className={`text-xs ${look.muted}`}>{member.role}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'faq') {
    if (section.config.faq.length === 0) return null
    return (
      <section id="faq" aria-labelledby="storefront-faq" className={look.section}>
        <SectionHead look={look} overline={copy.faq.overline} title={section.heading ?? copy.faq.title} />
        <div className={`mx-auto mt-6 max-w-2xl ${look.divider}`}>
          {section.config.faq.map((item) => (
            <details key={item.id} className="group py-4">
              <summary className={`flex cursor-pointer list-none items-start justify-between gap-4 marker:hidden ${look.cardTitle}`}>
                <span>{item.question}</span>
                <span aria-hidden className={`shrink-0 text-lg leading-none ${look.muted}`}>
                  +
                </span>
              </summary>
              <p className={`mt-2 text-sm leading-relaxed whitespace-pre-line ${look.muted}`}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'contact') {
    if (!profile.phone) return null
    return (
      <section id="contact" aria-labelledby="storefront-contact" className={look.section}>
        <div className={look.band}>
          <p className={look.overline}>{section.heading ?? copy.contact.overline}</p>
          <h2 className={look.bandTitle}>
            <a href={tel ?? '#enquiry'} className="underline-offset-8 hover:underline">
              {profile.phone}
            </a>
          </h2>
          <p className={look.bandMuted}>
            {[profile.city ? fill(copy.contact.based, { city: profile.city }) : null, copy.contact.replies]
              .filter(Boolean)
              .join(' · ')}
          </p>
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

  return null
}
