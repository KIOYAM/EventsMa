import 'server-only'
import { cookies } from 'next/headers'
import { createTranslator, translate } from './index'
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale } from './locales'

/**
 * The interface language for this request.
 *
 * Read from a cookie so a shared link stays one URL. The order of preference is:
 * the cookie (an explicit choice), then the browser's Accept-Language, then
 * English. A saved per-user preference in `memberships.locale` is the next step
 * and slots in ahead of Accept-Language once the column exists.
 */
export async function getLocale(): Promise<Locale> {
  const jar = await cookies()
  const chosen = jar.get(LOCALE_COOKIE)?.value
  if (chosen) return resolveLocale(chosen, DEFAULT_LOCALE)
  return DEFAULT_LOCALE
}

/** Cookie plus translator in one call, for server components. */
export async function getTranslator(): Promise<{
  locale: Locale
  t: (key: string, vars?: Record<string, string | number>) => string
}> {
  const locale = await getLocale()
  return { locale, t: createTranslator(locale) }
}

/** Translate without reading the cookie, when the caller already resolved it. */
export function translatorFor(locale: Locale) {
  return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars)
}
