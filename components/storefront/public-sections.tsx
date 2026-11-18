import { Badge } from '@/components/ui/badge'
import { pluralise } from '@/lib/domain/plural'
import { fontClass } from '@/lib/domain/storefront'
import type { StorefrontLook } from '@/lib/domain/storefront-look'
import type { PublicProfile, PublicSection } from '@/lib/db/public'
import { storefrontPublic as copy } from '@/lib/i18n/messages/en/storefront-public'

/** Initials wordmark, used when no logo image is uploaded. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
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
 */
export function StorefrontSection({
  section,
  index,
  look,
  profile,
  hideHeroAbout,
}: SectionProps) {
  const onImage = profile.theme === 'gallery'
  const top = index === 0
  const rule = (
    <div
      aria-hidden
      className="mb-2 h-0.5 w-8 rounded-pill"
      style={{ backgroundColor: 'var(--brand)' }}
    />
  )

  if (section.key === 'hero') {
    return (
      <header className={`${look.hero} ${top ? '' : 'mt-6'}`}>
        {section.imageUrl ? <img src={section.imageUrl} alt="" className={look.image} /> : null}
        {onImage && section.imageUrl ? (
          <div aria-hidden className="absolute inset-0 bg-forest/55" />
        ) : null}
        <div className={look.heroBody}>
          <p className={look.eyebrow}>{profile.city ?? copy.serviceArea}</p>
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
          <h1 className={`${look.title} ${fontClass(profile.brandFont)}`}>{profile.name}</h1>
          {profile.brandSubtitle ? (
            <p className={`${look.eyebrow} mt-2`}>{profile.brandSubtitle}</p>
          ) : null}
          {(section.heading ?? profile.tagline) ? (
            <p className={look.lede}>{section.heading ?? profile.tagline}</p>
          ) : null}
          {!hideHeroAbout && profile.about ? (
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
    )
  }

  if (section.key === 'about') {
    if (!profile.about) return null
    return (
      <section aria-labelledby="storefront-about" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-about" className={look.heading}>
          {section.heading ?? fill(copy.about.title, { business: profile.name })}
        </h2>
        <p className={`${look.lede} mt-3 whitespace-pre-line`}>{profile.about}</p>
      </section>
    )
  }

  if (section.key === 'services') {
    if (profile.services.length === 0) return null
    return (
      <section aria-labelledby="storefront-services" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-services" className={look.heading}>
          {section.heading ?? copy.services.title}
        </h2>
        <div className={look.grid}>
          {profile.services.map((service) => (
            <div key={service.verticalKey} className={look.card}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={look.cardTitle}>{service.label}</p>
                <p className={look.count}>
                  {service.itemCount > 0
                    ? `${service.itemCount} ${pluralise(service.itemNoun, service.itemCount)}`
                    : copy.services.catalogueOnRequest}
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
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{copy.services.note}</p>
      </section>
    )
  }

  if (section.key === 'packages') {
    if (profile.packages.length === 0) return null
    return (
      <section aria-labelledby="storefront-packages" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-packages" className={look.heading}>
          {section.heading ?? copy.packages.title}
        </h2>
        <div className={look.grid}>
          {profile.packages.map((pkg) => (
            <div key={pkg.id} className={look.card}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={look.cardTitle}>{pkg.name}</p>
                <p className={look.count}>{pkg.rate ?? copy.packages.onRequest}</p>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                {pkg.serviceLabel} · {pkg.unit}
              </p>
              {pkg.inclusions.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {pkg.inclusions.map((line) => (
                    <li key={line} className="text-xs leading-relaxed text-ink-muted">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
              {pkg.minQuantity ? (
                <p className="mt-2 text-xs text-ink-muted">
                  {fill(copy.packages.minimum, { n: String(pkg.minQuantity) })}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'gallery') {
    if (profile.portfolio.length === 0) return null
    return (
      <section aria-labelledby="storefront-work" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-work" className={look.heading}>
          {section.heading ?? copy.gallery.title}
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
    )
  }

  if (section.key === 'team') {
    if (section.config.team.length === 0) return null
    return (
      <section aria-labelledby="storefront-team" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-team" className={look.heading}>
          {section.heading ?? copy.team.title}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {section.config.team.map((member) => (
            <div key={member.id} className="card-surface p-4">
              <p className="text-sm font-medium text-ink">{member.name}</p>
              {member.role ? (
                <p className="mt-0.5 text-xs text-ink-muted">{member.role}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (section.key === 'faq') {
    if (section.config.faq.length === 0) return null
    return (
      <section aria-labelledby="storefront-faq" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-faq" className={look.heading}>
          {section.heading ?? copy.faq.title}
        </h2>
        <div className="mt-3 divide-y divide-hairline">
          {section.config.faq.map((item) => (
            <details key={item.id} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
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
      <section aria-labelledby="storefront-contact" className={top ? '' : look.section}>
        {rule}
        <h2 id="storefront-contact" className={look.heading}>
          {section.heading ?? copy.contact.title}
        </h2>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <a
              href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`}
              className="font-medium text-ink underline-offset-2 hover:underline"
            >
              {fill(copy.contact.call, { phone: profile.phone })}
            </a>
          </p>
          {profile.city ? (
            <p className="text-ink-muted">{fill(copy.contact.based, { city: profile.city })}</p>
          ) : null}
          <p className="text-xs text-ink-muted">{copy.contact.form}</p>
        </div>
      </section>
    )
  }

  return null
}
