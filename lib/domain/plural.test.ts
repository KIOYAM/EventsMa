import { describe, expect, it } from 'vitest'
import { pluralise } from './plural'

describe('pluralise', () => {
  it('keeps a singular noun for one', () => {
    expect(pluralise('dish', 1)).toBe('dish')
    expect(pluralise('coverage item', 1)).toBe('coverage item')
  })

  it('adds s for the regular case', () => {
    expect(pluralise('coverage item', 4)).toBe('coverage items')
    expect(pluralise('decor element', 0)).toBe('decor elements')
    expect(pluralise('day', 3)).toBe('days')
  })

  it('adds es after a sibilant', () => {
    expect(pluralise('dish', 0)).toBe('dishes')
    expect(pluralise('dish', 12)).toBe('dishes')
    expect(pluralise('box', 2)).toBe('boxes')
  })

  it('turns a consonant before y into ies', () => {
    expect(pluralise('category', 2)).toBe('categories')
  })

  it('does not invent a plural for an empty noun', () => {
    expect(pluralise('   ', 3)).toBe('')
  })
})
