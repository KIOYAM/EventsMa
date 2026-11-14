'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from './locales'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Remember the interface language of a signed-in user.
 *
 * The customer link keeps its own copy of this action because that surface is
 * frozen while the rollout proceeds; this one is the shared action for the
 * workspace shell. The value is validated before it is written, so a crafted
 * request cannot pin an unknown locale.
 */
export async function setUiLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  const jar = await cookies()
  jar.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
}
