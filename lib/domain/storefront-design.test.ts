import { describe, expect, it } from 'vitest'
import {
  DESIGN_DEFAULTS,
  designStyle,
  heroMinHeight,
  instagramUrl,
  resolveDesign,
  spacingClass,
  surfaceClass,
  whatsappUrl,
} from './storefront-design'

describe('resolveDesign', () => {
  it('returns the shipped look for anything missing or malformed', () => {
    expect(resolveDesign(undefined)).toEqual(DESIGN_DEFAULTS)
    expect(resolveDesign('nonsense')).toEqual(DESIGN_DEFAULTS)
    expect(
      resolveDesign({
        accent: 'red',
        surface: 'plaid',
        corners: 'bevel',
        spacing: 'huge',
        heroHeight: 'endless',
      }),
    ).toEqual(DESIGN_DEFAULTS)
  })

  it('keeps a valid accent and trims the owner’s wording to its limit', () => {
    const design = resolveDesign({
      accent: '#AA5511',
      ctaLabel: '  Book   your date  ',
      announcement: 'x'.repeat(200),
    })

    expect(design.accent).toBe('#AA5511')
    expect(design.ctaLabel).toBe('Book your date')
    expect(design.announcement).toHaveLength(120)
  })

  it('accepts only a dialable WhatsApp number and a real handle', () => {
    const design = resolveDesign({
      whatsapp: '+91 98431-55210',
      instagram: 'https://instagram.com/TinuEventer/?hl=en',
      email: 'hello@tinueventer.in',
    })

    expect(design.whatsapp).toBe('919843155210')
    expect(design.instagram).toBe('tinueventer')
    expect(design.email).toBe('hello@tinueventer.in')
    expect(resolveDesign({ whatsapp: '12345', instagram: 'a', email: 'no' })).toEqual({
      ...DESIGN_DEFAULTS,
      whatsapp: null,
      instagram: null,
      email: null,
    })
  })
})

describe('design tokens', () => {
  it('falls back to the theme’s own accent until the owner picks one', () => {
    expect(designStyle(resolveDesign(null), 'editorial')['--brand-accent']).toBe('#8a6524')
    expect(designStyle(resolveDesign(null), 'ledger')['--brand-accent']).toBe('#c56e4e')
    expect(designStyle(resolveDesign({ accent: '#112233' }), 'ledger')['--brand-accent']).toBe(
      '#112233',
    )
  })

  it('leaves the theme untouched unless a surface, rhythm or height is chosen', () => {
    const defaults = resolveDesign(null)
    expect(surfaceClass(defaults, 'bg-canvas')).toBe('bg-canvas')
    expect(spacingClass(defaults)).toBeNull()
    expect(heroMinHeight(defaults)).toBeNull()

    expect(surfaceClass(resolveDesign({ surface: 'paper' }), 'bg-canvas')).toBe('bg-paper')
    expect(spacingClass(resolveDesign({ spacing: 'airy' }))).toBe('py-24!')
    expect(heroMinHeight(resolveDesign({ heroHeight: 'short' }))).toBe('24rem')
  })

  it('builds links from the stored value, not the typed text', () => {
    expect(whatsappUrl('919843155210')).toBe('https://wa.me/919843155210')
    expect(instagramUrl('tinueventer')).toBe('https://instagram.com/tinueventer')
  })
})
