import { describe, expect, it, vi } from 'vitest'
import { createTranslator, interpolate, translate, translationCoverage } from './index'
import { formatDateLocalised, formatPaiseLocalised, formatTimeLocalised } from './format'
import { htmlLang, isLocale, resolveLocale } from './locales'

describe('resolveLocale', () => {
  it('accepts a bare code, a region tag and an underscore tag', () => {
    expect(resolveLocale('ta')).toBe('ta')
    expect(resolveLocale('ta-IN')).toBe('ta')
    expect(resolveLocale('ta_IN')).toBe('ta')
    expect(resolveLocale('TA-in')).toBe('ta')
  })

  it('picks the first supported language out of Accept-Language', () => {
    expect(resolveLocale('fr-FR,fr;q=0.9,ta;q=0.8')).toBe('ta')
    expect(resolveLocale('en-GB,en;q=0.9')).toBe('en')
  })

  it('falls back for nothing, junk and unsupported languages', () => {
    expect(resolveLocale(null)).toBe('en')
    expect(resolveLocale('')).toBe('en')
    expect(resolveLocale('klingon')).toBe('en')
    expect(resolveLocale(undefined, 'ta')).toBe('ta')
  })

  it('guards the type', () => {
    expect(isLocale('ml')).toBe(true)
    expect(isLocale('fr')).toBe(false)
  })
})

describe('translate', () => {
  it('returns the locale string when it exists', () => {
    expect(translate('ta', 'nav.events')).toBe('நிகழ்வுகள்')
    expect(translate('en', 'nav.events')).toBe('Events')
  })

  it('falls back to English for a key the locale has not translated', () => {
    // `common.confirm` is English-only on purpose: the fallback must be silent.
    expect(translate('ta', 'common.confirm')).toBe('Confirm')
  })

  it('interpolates numbers and strings', () => {
    expect(translate('ta', 'share.chosen', { count: 3 })).toBe('3 தேர்ந்தெடுக்கப்பட்டது')
    expect(interpolate('{a} of {b}', { a: 1, b: 4 })).toBe('1 of 4')
  })

  it('leaves an unknown placeholder visible rather than printing undefined', () => {
    expect(interpolate('{known} {unknown}', { known: 'x' })).toBe('x {unknown}')
  })

  it('returns the key path for a missing key, loudly', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(translate('en', 'nav.doesNotExist')).toBe('nav.doesNotExist')
    warn.mockRestore()
  })

  it('exposes a bound translator', () => {
    const t = createTranslator('ta')
    expect(t('nav.team')).toBe('குழு')
  })
})

describe('coverage', () => {
  it('reports English as complete', () => {
    expect(translationCoverage('en').percent).toBe(100)
  })

  it('reports the untranslated keys instead of pretending', () => {
    const ta = translationCoverage('ta')
    expect(ta.percent).toBeGreaterThan(0)
    expect(ta.percent).toBeLessThan(100)
    expect(ta.missing).toContain('common.confirm')
  })

  it('reports an empty locale as 0%', () => {
    expect(translationCoverage('te').percent).toBe(0)
  })
})

describe('formatting', () => {
  it('renders integer paise as Indian-grouped rupees', () => {
    expect(formatPaiseLocalised(48750000, 'en')).toBe('₹4,87,500')
    expect(formatPaiseLocalised(0, 'en')).toBe('₹0')
    expect(formatPaiseLocalised(-500, 'en')).toBe('₹0')
  })

  it('keeps the day when parsing a bare ISO date', () => {
    expect(formatDateLocalised('2027-02-14', 'en')).toContain('14')
    expect(formatDateLocalised('2027-02-14', 'ta', 'long')).toContain('2027')
  })

  it('keeps a session time readable', () => {
    expect(formatTimeLocalised('19:30', 'en')).toMatch(/7:30/)
    expect(formatTimeLocalised('not-a-time', 'en')).toBe('not-a-time')
  })

  it('exposes a BCP-47 tag for html lang', () => {
    expect(htmlLang('ta')).toBe('ta-IN')
    expect(htmlLang('en')).toBe('en-IN')
  })
})
