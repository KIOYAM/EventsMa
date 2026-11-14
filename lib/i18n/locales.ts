/**
 * The locale registry.
 *
 * One source of truth for which languages exist, how their names are written in
 * their own script, and which Intl locale formats their dates and money.
 *
 * A locale is an interface language (`en`, `ta`, …). It is never a database value:
 * statuses, service keys and API fields stay English identifiers so a language
 * switch cannot change what the server stores.
 */

export const LOCALES = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr', intl: 'en-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', dir: 'ltr', intl: 'ta-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', dir: 'ltr', intl: 'te-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', dir: 'ltr', intl: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', dir: 'ltr', intl: 'ml-IN' },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export type LocaleMeta = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie that carries the interface language. Not a session, not a secret. */
export const LOCALE_COOKIE = 'eventsma_locale'

const CODES = new Set<string>(LOCALES.map((locale) => locale.code))

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && CODES.has(value)
}

/**
 * Map anything locale-shaped onto a supported locale.
 *
 * Accepts `ta`, `ta-IN`, `ta_IN`, `TA-in` and a comma-separated `Accept-Language`
 * header. Anything unsupported falls back rather than throwing: a wrong language
 * is a cosmetic bug, a crashed page is not.
 */
export function resolveLocale(value: string | null | undefined, fallback: Locale = DEFAULT_LOCALE): Locale {
  if (!value) return fallback

  const candidates = value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  for (const candidate of candidates) {
    // `ta-in;q=0.9` → `ta-in` → `ta`
    const primary = candidate.split(';')[0]?.replace('_', '-').split('-')[0]?.trim()
    if (isLocale(primary)) return primary
  }

  return fallback
}

/**
 * Languages whose catalogue is complete enough to offer.
 *
 * Offering a language the app cannot speak is worse than not offering it: the
 * customer picks தமிழ், half the screen stays English and trust drops. This list
 * grows only when a surface is fully covered and reviewed.
 */
export const SHIPPED_LOCALES: readonly Locale[] = ['en', 'ta']

export function localeMeta(code: Locale): LocaleMeta {
  return LOCALES.find((locale) => locale.code === code) ?? LOCALES[0]
}

/** BCP-47 tag for `<html lang>` and Intl, e.g. `ta-IN`. */
export function htmlLang(code: Locale): string {
  return localeMeta(code).intl
}

export function localeDirection(code: Locale): 'ltr' | 'rtl' {
  return localeMeta(code).dir
}
