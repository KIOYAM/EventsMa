'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n/locales'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Remember the language this visitor chose.
 *
 * A cookie, not a column: a customer on a share link has no account, and the
 * choice has to survive a refresh on a page that is already dynamic. The value is
 * validated before it is written, so a crafted request cannot pin an unknown
 * locale.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  const jar = await cookies()
  jar.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
}
