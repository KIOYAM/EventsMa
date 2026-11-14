/**
 * The translation core.
 *
 * Catalogs are plain objects: English is complete, every other locale is a deep
 * partial merged over it at read time. That means a half-translated language
 * renders English for the gaps instead of showing a key or crashing — and the
 * coverage function can report exactly how much is left.
 */

import { DEFAULT_LOCALE, type Locale } from './locales'
import { en, type Messages, type MessagesOverride } from './messages/en'
import { ta } from './messages/ta'

const CATALOGUES: Record<Locale, MessagesOverride> = {
  en,
  ta,
  te: {},
  kn: {},
  ml: {},
}

export type TranslateVars = Readonly<Record<string, string | number>>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** English first, then the locale's strings over the top. Never mutates inputs. */
function merge(base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    const existing = merged[key]
    merged[key] = isPlainObject(value) && isPlainObject(existing) ? merge(existing, value) : value
  }
  return merged
}

const merged = new Map<Locale, Record<string, unknown>>()

function catalogue(locale: Locale): Record<string, unknown> {
  const cached = merged.get(locale)
  if (cached) return cached
  const built = merge(en as unknown as Record<string, unknown>, CATALOGUES[locale] as Record<string, unknown>)
  merged.set(locale, built)
  return built
}

function lookup(tree: Record<string, unknown>, path: string): string | undefined {
  let node: unknown = tree
  for (const part of path.split('.')) {
    if (!isPlainObject(node)) return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** `{count} chosen` + `{ count: 2 }` → `2 chosen`. Unknown placeholders stay visible. */
export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

/**
 * Translate one key. Missing keys return the key path rather than a blank, so an
 * untranslated string is obvious in review instead of silently disappearing.
 */
export function translate(locale: Locale, key: string, vars?: TranslateVars): string {
  const text = lookup(catalogue(locale), key) ?? lookup(catalogue(DEFAULT_LOCALE), key)
  if (text === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] missing key: ${key}`)
    }
    return key
  }
  return interpolate(text, vars)
}

export function createTranslator(locale: Locale): (key: string, vars?: TranslateVars) => string {
  return (key, vars) => translate(locale, key, vars)
}

function flatten(tree: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(value)) keys.push(...flatten(value, path))
    else if (typeof value === 'string') keys.push(path)
  }
  return keys
}

const englishKeys = flatten(en as unknown as Record<string, unknown>)

/** How much of the English catalogue a locale covers, and which keys are left. */
export function translationCoverage(locale: Locale): {
  locale: Locale
  total: number
  translated: number
  percent: number
  missing: string[]
} {
  const own = catalogue(locale)
  const overrides = CATALOGUES[locale]
  const missing = englishKeys.filter((key) => lookup(overrides as Record<string, unknown>, key) === undefined)
  const translated = englishKeys.length - missing.length
  return {
    locale,
    total: englishKeys.length,
    translated,
    percent: englishKeys.length === 0 ? 100 : Math.round((translated / englishKeys.length) * 100),
    missing,
  }
}

export type { Locale } from './locales'
export type { Messages } from './messages/en'
