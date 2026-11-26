/**
 * The search-and-sharing overrides an owner controls.
 *
 * A storefront's title and description used to be derived from the business name
 * and tagline, which is a fine default and a poor ceiling: the owner is the only
 * person who knows what a customer types into Google. These fields are draft data
 * until a publish freezes them, exactly like the heading and colour beside them.
 */
export interface StorefrontSeo {
  /** Overrides the document title. Null keeps the business-name default. */
  title: string | null
  /** Overrides the meta description. Null keeps the tagline-derived default. */
  description: string | null
  /** Keep the page out of search results without unpublishing it. */
  noindex: boolean
}

/** Google truncates around these; the builder counts against them. */
export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 160

export function emptySeo(): StorefrontSeo {
  return { title: null, description: null, noindex: false }
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ').slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

/** One read path, so a hand-edited settings blob or an old snapshot cannot inject markup. */
export function sanitiseSeo(raw: unknown): StorefrontSeo {
  if (typeof raw !== 'object' || raw === null) return emptySeo()
  const value = raw as Record<string, unknown>
  return {
    title: text(value.title, SEO_TITLE_MAX),
    description: text(value.description, SEO_DESCRIPTION_MAX),
    noindex: value.noindex === true,
  }
}

/** The draft values live in `businesses.settings.seo`. */
export function seoFromSettings(settings: unknown): StorefrontSeo {
  if (typeof settings !== 'object' || settings === null) return emptySeo()
  return sanitiseSeo((settings as Record<string, unknown>).seo)
}

export interface ResolvedSeo {
  title: string
  description: string
  noindex: boolean
}

/**
 * Override first, then the page's own derivation. A description over 160
 * characters is not truncated here: the owner sees the count in the builder, and
 * silently cutting their sentence would be a different sentence.
 */
export function resolveSeo(
  seo: StorefrontSeo | null | undefined,
  defaults: { title: string; description: string },
): ResolvedSeo {
  return {
    title: seo?.title ?? defaults.title,
    description: seo?.description ?? defaults.description,
    noindex: seo?.noindex ?? false,
  }
}
