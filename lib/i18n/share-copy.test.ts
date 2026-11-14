import { describe, expect, it } from 'vitest'
import { createTranslator, translationCoverage } from './index'
import { ruleLabelLocalised, verdictMessageLocalised } from './rule-copy'

const en = createTranslator('en')
const ta = createTranslator('ta')

describe('customer rule copy', () => {
  it('renders the rule badge in both languages', () => {
    const rule = { minSelections: 2, maxSelections: 4, required: true }
    expect(ruleLabelLocalised(en, rule)).toBe('Choose 2–4')
    expect(ruleLabelLocalised(ta, rule)).toBe('2–4 தேர்ந்தெடுக்கவும்')
  })

  it('handles an exact count and an unlimited rule', () => {
    expect(ruleLabelLocalised(en, { minSelections: 3, maxSelections: 3, required: true })).toBe(
      'Choose 3',
    )
    expect(ruleLabelLocalised(en, { minSelections: 0, maxSelections: null, required: false })).toBe(
      'Any number',
    )
    expect(ruleLabelLocalised(en, { minSelections: 2, maxSelections: null, required: false })).toBe(
      'At least 2',
    )
  })

  it('builds the over-maximum message from the reason code, not from English', () => {
    const message = verdictMessageLocalised(
      ta,
      { ok: false, reason: 'above_maximum', message: 'English leak' },
      { minSelections: 2, maxSelections: 4, required: true },
      5,
    )
    expect(message).toContain('4')
    expect(message).toContain('5')
    expect(message).not.toContain('English leak')
  })

  it('builds the under-minimum and required messages', () => {
    expect(
      verdictMessageLocalised(
        en,
        { ok: false, reason: 'below_minimum', message: '' },
        { minSelections: 2, maxSelections: 4, required: true },
        1,
      ),
    ).toBe('Choose at least 2 here; 1 selected.')

    expect(
      verdictMessageLocalised(
        en,
        { ok: false, reason: 'required', message: '' },
        { minSelections: 0, maxSelections: null, required: true },
        0,
      ),
    ).toBe('This category is required.')
  })

  it('says nothing when the rule is satisfied', () => {
    expect(
      verdictMessageLocalised(en, { ok: true, count: 3 }, { minSelections: 2, maxSelections: 4, required: true }, 3),
    ).toBe('')
  })
})

describe('share surface completeness', () => {
  it('has every share string in Tamil, so the customer never sees a half-English screen', () => {
    const missing = translationCoverage('ta').missing.filter((key) => key.startsWith('share.'))
    expect(missing).toEqual([])
  })

  it('has every rule string in Tamil', () => {
    const missing = translationCoverage('ta').missing.filter((key) => key.startsWith('rule.'))
    expect(missing).toEqual([])
  })

  it('keeps the placeholder names aligned between languages', () => {
    const keys = ['share.chosen', 'share.perGuestTimes', 'share.errorDishGone']
    for (const key of keys) {
      const english = en(key, { count: 1, guests: 1, session: 'X' })
      const tamil = ta(key, { count: 1, guests: 1, session: 'X' })
      expect(english).not.toContain('{')
      expect(tamil).not.toContain('{')
    }
  })
})
