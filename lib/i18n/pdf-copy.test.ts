import { describe, expect, it } from 'vitest'
import { createTranslator, translationCoverage } from './index'
import { UNIT_CLASSES } from '@/lib/domain/units'

const en = createTranslator('en')
const ta = createTranslator('ta')

/**
 * The PDF cannot fall back to "show the key": a document is what a customer keeps.
 * These tests fail loudly if a key is missing, or if the unit map in
 * `lib/pdf/quote-pdf.tsx` points at something that does not exist.
 */
const UNIT_KEYS = {
  PER_GUEST: 'pdf.unitPerGuest',
  PER_UNIT: 'pdf.unitPerUnit',
  FLAT: 'pdf.unitFlat',
  PER_HOUR: 'pdf.unitPerHour',
  PER_DAY: 'pdf.unitPerDay',
} as const

describe('quotation PDF copy', () => {
  it('has every pdf string in Tamil', () => {
    expect(translationCoverage('ta').missing.filter((key) => key.startsWith('pdf.'))).toEqual([])
  })

  it('translates the document skeleton, not just the labels', () => {
    expect(en('pdf.quotation')).toBe('QUOTATION')
    expect(ta('pdf.quotation')).toBe('விலைப்புள்ளி')
    expect(ta('pdf.total')).toBe('மொத்தம்')
    expect(ta('pdf.terms')).toContain('விலைப்புள்ளி')
  })

  it('resolves a unit word for every unit class, in both languages', () => {
    for (const unit of UNIT_CLASSES) {
      const key = UNIT_KEYS[unit.key]
      expect(key, `no key for ${unit.key}`).toBeTruthy()
      expect(en(key)).not.toBe(key)
      expect(ta(key)).not.toBe(key)
    }
  })

  it('keeps placeholders aligned', () => {
    expect(en('pdf.guests', { count: 250 })).toBe('250 guests')
    expect(ta('pdf.guests', { count: 250 })).not.toContain('{')
  })
})
