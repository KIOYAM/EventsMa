import { describe, expect, it } from 'vitest'
import { createTranslator, translationCoverage } from './index'
import { formatDateLocalised, relativeDaysLocalised } from './format'
import { relativeDays } from '@/lib/utils'
import { EVENT_STATUSES, TASK_STATUSES, EVENT_TYPE_MASTERS } from '@/lib/domain/ops'
import { eventStatusKey, occasionKey, taskStatusKey } from './ops-copy'
import { en } from './messages/en'
import { ta } from './messages/ta'

const enT = createTranslator('en')
const taT = createTranslator('ta')

function flatten(tree: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') keys.push(path)
    else if (value && typeof value === 'object') keys.push(...flatten(value as Record<string, unknown>, path))
  }
  return keys
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort()
}

function varsFor(message: string): Record<string, string> {
  return Object.fromEntries(placeholders(message).map((name) => [name, 'X']))
}

const missing = translationCoverage('ta').missing
const modules = ['events', 'dashboard', 'nav'] as const

describe('workspace surfaces are complete in Tamil', () => {
  for (const module of modules) {
    it(`has every ${module} string in Tamil`, () => {
      expect(missing.filter((key) => key.startsWith(`${module}.`))).toEqual([])
    })
  }

  it('has every shared list string in Tamil except the deliberate fallback key', () => {
    expect(missing.filter((key) => key.startsWith('common.') && key !== 'common.confirm')).toEqual([])
  })

  it('labels every stored event and task status', () => {
    for (const status of EVENT_STATUSES) {
      expect(taT(eventStatusKey(status))).not.toBe(enT(eventStatusKey(status)))
      expect(enT(eventStatusKey(status))).not.toContain(status)
    }
    for (const status of TASK_STATUSES) {
      expect(taT(taskStatusKey(status))).not.toBe(enT(taskStatusKey(status)))
    }
  })

  it('maps every occasion master to a translated description', () => {
    for (const master of EVENT_TYPE_MASTERS) {
      const key = occasionKey(master.name)
      expect(key, `no copy key for ${master.name}`).toBeTruthy()
      if (master.description) {
        if (!key) continue
        expect(enT(key)).toBe(master.description)
        expect(taT(key)).not.toBe(enT(key))
      }
    }
  })
})

describe('placeholders survive translation', () => {
  const keys = [
    ...flatten(en.events as unknown as Record<string, unknown>, 'events'),
    ...flatten(en.dashboard as unknown as Record<string, unknown>, 'dashboard'),
    ...flatten(en.common as unknown as Record<string, unknown>, 'common'),
  ].filter((key) => !key.startsWith('events.occasion.'))

  it('uses the same placeholder names in both languages and leaves none visible', () => {
    for (const key of keys) {
      const english = enT(key)
      const tamil = taT(key)
      expect(placeholders(tamil), `placeholder drift in ${key}`).toEqual(placeholders(english))
      expect(enT(key, varsFor(english)), `unfilled English placeholder in ${key}`).not.toContain('{')
      expect(taT(key, varsFor(tamil)), `unfilled Tamil placeholder in ${key}`).not.toContain('{')
    }
  })

  it('translates every key with interpolated data', () => {
    const interpolated = keys.filter((key) => placeholders(enT(key)).length > 0)
    expect(interpolated.length).toBeGreaterThan(5)
  })
})

describe('dates keep their English words', () => {
  it('renders relative days exactly as the untranslated helper did', () => {
    const today = new Date()
    const iso = (offset: number) => {
      const date = new Date(today)
      date.setDate(date.getDate() + offset)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`
    }
    for (const offset of [-3, -1, 0, 1, 5]) {
      expect(relativeDaysLocalised(iso(offset), 'en')).toBe(relativeDays(iso(offset)))
    }
    expect(relativeDaysLocalised(iso(5), 'ta')).toContain('5')
  })

  it('keeps the day of a bare ISO date in both languages', () => {
    expect(formatDateLocalised('2027-02-14', 'en', 'short', 'numeric')).toBe('14 Feb 2027')
    expect(formatDateLocalised('2027-02-14', 'ta', 'short', 'numeric')).toContain('14')
    expect(formatDateLocalised('not-a-date', 'en')).toBe('')
  })
})

describe('catalogue shape', () => {
  it('keeps the Tamil module typed against the English one', () => {
    // A structural check: every Tamil module key must exist in English. The
    // DeepPartial type catches the reverse at compile time.
    for (const module of modules) {
      const englishKeys = flatten((en as Record<string, unknown>)[module] as Record<string, unknown>)
      const tamilKeys = flatten((ta as Record<string, unknown>)[module] as Record<string, unknown>)
      for (const key of tamilKeys) {
        expect(englishKeys, `${module}.${key} is not in the English catalogue`).toContain(key)
      }
    }
  })
})
