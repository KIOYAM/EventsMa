import { describe, expect, it } from 'vitest'
import { emptySeo, resolveSeo, sanitiseSeo, seoFromSettings } from './storefront-seo'

describe('sanitiseSeo', () => {
  it('trims and collapses whitespace in both fields', () => {
    const seo = sanitiseSeo({ title: '  Kannan   Events ', description: ' Weddings\n in Kochi ' })
    expect(seo.title).toBe('Kannan Events')
    expect(seo.description).toBe('Weddings in Kochi')
  })

  it('caps a title at 60 characters and a description at 160', () => {
    const seo = sanitiseSeo({ title: 'x'.repeat(200), description: 'y'.repeat(400) })
    expect(seo.title).toHaveLength(60)
    expect(seo.description).toHaveLength(160)
  })

  it('treats a blank field as no override rather than an empty string', () => {
    const seo = sanitiseSeo({ title: '   ', description: '' })
    expect(seo.title).toBeNull()
    expect(seo.description).toBeNull()
  })

  it('accepts only a real boolean true for noindex', () => {
    expect(sanitiseSeo({ noindex: 'true' }).noindex).toBe(false)
    expect(sanitiseSeo({ noindex: true }).noindex).toBe(true)
  })

  it('survives a missing or malformed payload', () => {
    expect(sanitiseSeo(null)).toEqual(emptySeo())
    expect(sanitiseSeo('not an object')).toEqual(emptySeo())
  })
})

describe('seoFromSettings', () => {
  it('reads the draft override out of the settings blob', () => {
    expect(seoFromSettings({ seo: { title: 'Kannan Events' }, taxMode: 'inclusive' }).title).toBe(
      'Kannan Events',
    )
  })

  it('returns empty for a workspace that has never saved one', () => {
    expect(seoFromSettings({})).toEqual(emptySeo())
    expect(seoFromSettings(undefined)).toEqual(emptySeo())
  })
})

describe('resolveSeo', () => {
  const defaults = { title: 'Kannan Events', description: 'Weddings and receptions in Kochi' }

  it('uses the owner override when present', () => {
    expect(
      resolveSeo({ title: 'Catering in Kochi', description: 'Banana leaf service', noindex: true }, defaults),
    ).toEqual({ title: 'Catering in Kochi', description: 'Banana leaf service', noindex: true })
  })

  it('falls back to the derived copy and stays indexable', () => {
    expect(resolveSeo(emptySeo(), defaults)).toEqual({ ...defaults, noindex: false })
    expect(resolveSeo(null, defaults)).toEqual({ ...defaults, noindex: false })
  })
})
