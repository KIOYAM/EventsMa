import { describe, expect, it } from 'vitest'
import { isTranslatableLocale, localiseContent, localiseFrom } from './translations'

const source = { name: 'Chicken Biryani', description: 'Traditional chicken biryani' }

describe('localiseContent', () => {
  it('returns the source when there is no translation', () => {
    expect(localiseContent(source, null)).toEqual(source)
    expect(localiseContent(source, undefined)).toEqual(source)
  })

  it('replaces both fields when both are translated', () => {
    expect(
      localiseContent(source, { name: 'சிக்கன் பிரியாணி', description: 'பாரம்பரிய சிக்கன் பிரியாணி' }),
    ).toEqual({ name: 'சிக்கன் பிரியாணி', description: 'பாரம்பரிய சிக்கன் பிரியாணி' })
  })

  it('falls back per field, so a half-filled translation never blanks a line', () => {
    expect(localiseContent(source, { name: 'சிக்கன் பிரியாணி', description: null })).toEqual({
      name: 'சிக்கன் பிரியாணி',
      description: 'Traditional chicken biryani',
    })
  })

  it('treats a blank string as absent rather than as content', () => {
    expect(localiseContent(source, { name: '   ', description: '' })).toEqual(source)
  })

  it('keeps other fields of the record untouched', () => {
    const dish = { ...source, pricePaise: 22000, dietary: 'non_veg' }
    const localised = localiseContent(dish, { name: 'சிக்கன் பிரியாணி', description: null })
    expect(localised.pricePaise).toBe(22000)
    expect(localised.dietary).toBe('non_veg')
  })

  it('does not mutate the source object', () => {
    const dish = { ...source }
    localiseContent(dish, { name: 'x', description: 'y' })
    expect(dish).toEqual(source)
  })
})

describe('localiseFrom', () => {
  const map = new Map([['a', { name: 'சிக்கன் பிரியாணி', description: null }]])

  it('uses the translation for a known id', () => {
    expect(localiseFrom({ ...source, id: 'a' }, map, 'a').name).toBe('சிக்கன் பிரியாணி')
  })

  it('falls back for an unknown id', () => {
    expect(localiseFrom({ ...source, id: 'b' }, map, 'b').name).toBe('Chicken Biryani')
  })
})

describe('isTranslatableLocale', () => {
  it('accepts the four languages that are translated content', () => {
    expect(isTranslatableLocale('ta')).toBe(true)
    expect(isTranslatableLocale('ml')).toBe(true)
  })

  it('rejects English (it is the source column) and junk', () => {
    expect(isTranslatableLocale('en')).toBe(false)
    expect(isTranslatableLocale('fr')).toBe(false)
    expect(isTranslatableLocale(null)).toBe(false)
  })
})
