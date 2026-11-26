/**
 * Where a storefront visitor came from, reduced to what the owner can act on.
 *
 * The page is public and unauthenticated, so everything here is untrusted input:
 * a client can post any referrer or query string it likes. Only the referring
 * host and a sanitised UTM set are kept — never the full URL, which can carry
 * search terms, tokens or a client's name. Nothing here identifies a person.
 *
 * Landing sections are a fixed vocabulary. A new section needs an entry here,
 * otherwise its clicks are recorded as unattributed rather than as free text.
 */
import type { SectionKey } from './storefront'

export interface StorefrontAttribution {
  referrerHost: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  landingSection: SectionKey | ''
}

/** Element id on the public page → the section it belongs to. */
const SECTION_BY_ELEMENT: Record<string, SectionKey> = {
  top: 'hero',
  about: 'about',
  services: 'services',
  menus: 'packages',
  work: 'gallery',
  testimonials: 'testimonials',
  team: 'team',
  faq: 'faq',
  contact: 'contact',
  closing: 'enquiry',
  enquiry: 'enquiry',
  mobile: 'enquiry',
}

/**
 * One vocabulary for every stored token: lower case, whitespace collapsed to a
 * dash, no punctuation that could smuggle a delimiter into the bucket key.
 * Unicode letters survive, so a Tamil campaign name is not silently erased.
 */
function token(value: unknown, max = 60): string {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    // \p{M} keeps Indic vowel signs attached to their consonant; without it a
    // Tamil campaign name is stored as fragments separated by dashes.
    .replace(/[^\p{L}\p{N}\p{M}._~-]+/gu, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, max)
}

/** Host only, no scheme, path or query. `www.` is noise, not a different source. */
export function referrerHost(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) return ''
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return token(url.hostname.replace(/^www\./i, ''), 120)
  } catch {
    return ''
  }
}

export function utmFromQuery(query: unknown): Pick<
  StorefrontAttribution,
  'utmSource' | 'utmMedium' | 'utmCampaign'
> {
  const empty = { utmSource: '', utmMedium: '', utmCampaign: '' }
  if (typeof query !== 'string' || query.trim().length === 0) return empty
  let params: URLSearchParams
  try {
    params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
  } catch {
    return empty
  }
  return {
    utmSource: token(params.get('utm_source')),
    utmMedium: token(params.get('utm_medium')),
    utmCampaign: token(params.get('utm_campaign')),
  }
}

/** Unknown ids are dropped: an owner's report shows the page's real sections. */
export function landingSection(value: unknown): SectionKey | '' {
  if (typeof value !== 'string') return ''
  return SECTION_BY_ELEMENT[value.trim().toLowerCase()] ?? ''
}

export function parseAttribution(input: {
  referrer?: unknown
  query?: unknown
  section?: unknown
}): StorefrontAttribution {
  const utm = utmFromQuery(input.query)
  return {
    referrerHost: referrerHost(input.referrer),
    landingSection: landingSection(input.section),
    ...utm,
  }
}

/**
 * The rollup key. One row per (org, day, path, source) rather than one per view,
 * so a popular page stays a single counter instead of a request log. Empty parts
 * are kept as empty positions, which is what makes two direct visits collide.
 */
export function attributionBucket(
  path: string,
  attribution: StorefrontAttribution,
): string {
  return [
    path,
    attribution.referrerHost,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
  ]
    .map((part) => part.replace(/\|/g, ''))
    .join('|')
    .slice(0, 300)
}
