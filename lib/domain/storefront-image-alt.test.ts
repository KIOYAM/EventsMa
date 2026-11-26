import { describe, expect, it } from 'vitest'
import { heroImageAlt, logoImageAlt, portfolioImageAlt } from './storefront-image-alt'

describe('storefront alt text', () => {
  it('names the business and its city in the hero', () => {
    expect(heroImageAlt({ name: 'Kannan Events', city: 'Kochi' })).toBe('Kannan Events — Kochi')
    expect(heroImageAlt({ name: 'Kannan Events', city: null })).toBe('Kannan Events')
  })

  it('trims owner-entered whitespace', () => {
    expect(heroImageAlt({ name: '  Kannan Events  ', city: '  Kochi ' })).toBe(
      'Kannan Events — Kochi',
    )
  })

  it('names the work and the venue in a portfolio tile', () => {
    expect(portfolioImageAlt({ title: 'Meenakshi wedding', venueName: 'Fort Kochi' })).toBe(
      'Meenakshi wedding · Fort Kochi',
    )
    expect(portfolioImageAlt({ title: 'Meenakshi wedding', venueName: null })).toBe(
      'Meenakshi wedding',
    )
  })

  it('never returns a bare separator when the content is empty', () => {
    expect(portfolioImageAlt({ title: '', venueName: 'Fort Kochi' })).toBe('Fort Kochi')
    expect(portfolioImageAlt({ title: '', venueName: null })).toBe('')
    expect(heroImageAlt({ name: '', city: null })).toBe('')
  })

  it('labels the logo with the business name', () => {
    expect(logoImageAlt('Kannan Events')).toBe('Kannan Events logo')
    expect(logoImageAlt('  ')).toBe('')
  })
})
