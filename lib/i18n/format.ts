/**
 * Locale-aware formatting.
 *
 * These functions change how a value reads, never what it is: money stays integer
 * paise in the database, dates stay ISO strings, and a language switch cannot move
 * a total or a day. Use them for display only.
 */

import { localeMeta, type Locale } from './locales'
import { createTranslator } from './index'

/** `48750000` paise → `₹4,87,500` in every locale (INR grouping, no paise shown). */
export function formatPaiseLocalised(paise: number, locale: Locale): string {
  const whole = Math.max(0, Math.trunc(paise))
  return new Intl.NumberFormat(localeMeta(locale).intl, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(whole / 100)
}

/** Integer count with locale grouping. */
export function formatNumberLocalised(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeMeta(locale).intl, { maximumFractionDigits: 0 }).format(
    Math.trunc(value),
  )
}

/**
 * A date in the reader's language.
 *
 * A bare `YYYY-MM-DD` is parsed as local midnight on purpose: `new Date('2027-02-14')`
 * is UTC midnight and renders as the 13th for anyone west of Greenwich.
 *
 * `day` defaults to the share link's padded form. Surfaces that previously used
 * `shortDate` pass `numeric` so their English output stays byte-identical while
 * the month and year still follow the locale.
 */
export function formatDateLocalised(
  value: string | Date,
  locale: Locale,
  style: 'short' | 'long' = 'short',
  day: 'numeric' | '2-digit' = '2-digit',
): string {
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(localeMeta(locale).intl, {
    day,
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(date)
}


/** `19:30` stays `19:30`; only the separator changes where a locale needs one. */
export function formatTimeLocalised(value: string, locale: Locale): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return value
  const date = new Date(1970, 0, 1, Number(match[1]), Number(match[2]))
  return new Intl.DateTimeFormat(localeMeta(locale).intl, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * "Today", "in 5 days", "3 days ago" in the reader's language.
 *
 * Same arithmetic as `lib/utils.relativeDays` so the English text is unchanged;
 * only the words come from the catalogue.
 */
export function relativeDaysLocalised(value: string | Date, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''

  const today = new Date()
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfValue = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((startOfValue - startOfToday) / 86_400_000)
  const t = createTranslator(locale)

  if (days === 0) return t('common.today')
  if (days === 1) return t('common.tomorrow')
  if (days === -1) return t('common.yesterday')
  return days > 0
    ? t('common.inDays', { count: days })
    : t('common.daysAgo', { count: Math.abs(days) })
}
