import { describe, expect, it } from 'vitest'
import { basisForUnit, groupByService, priceSelection, totalPaise, type PricedSelection } from './share-pricing'
import type { UnitClass } from './units'

const line = (
  unitClass: UnitClass,
  unitPricePaise: number,
  quantity: number,
  serviceKey = 'catering',
): PricedSelection =>
  priceSelection(
    { itemId: `${serviceKey}-${unitClass}`, serviceKey, label: 'Sample', unitClass, quantity, unitPricePaise },
    250,
  )

describe('basisForUnit', () => {
  it('prices per guest by the session guest count, not the quantity box', () => {
    expect(basisForUnit('PER_GUEST', 250, 7)).toBe(250)
  })

  it('prices a flat line once regardless of quantity', () => {
    expect(basisForUnit('FLAT', 250, 9)).toBe(1)
  })

  it('multiplies per-unit and per-day lines by quantity', () => {
    expect(basisForUnit('PER_UNIT', 250, 3)).toBe(3)
    expect(basisForUnit('PER_DAY', 250, 2)).toBe(2)
    expect(basisForUnit('PER_HOUR', 250, 4)).toBe(4)
  })

  it('never produces a negative basis from a negative guest count', () => {
    expect(basisForUnit('PER_GUEST', -20, 1)).toBe(0)
  })
})

describe('priceSelection', () => {
  it('computes a per-guest amount in integer paise', () => {
    expect(line('PER_GUEST', 45_000, 1).amountPaise).toBe(11_250_000)
  })

  it('computes a per-unit amount from quantity', () => {
    expect(line('PER_UNIT', 150_000, 4).amountPaise).toBe(600_000)
  })

  it('charges a flat item once even when quantity is high', () => {
    expect(line('FLAT', 3_500_000, 12).amountPaise).toBe(3_500_000)
  })

  it('treats a zero or missing quantity as one unit', () => {
    expect(line('PER_UNIT', 1_000, 0).quantity).toBe(1)
  })

  it('floors a negative catalogue price at zero instead of returning credit', () => {
    expect(line('PER_UNIT', -500, 2).amountPaise).toBe(0)
  })
})

describe('grouping and totals', () => {
  it('subtotals each service and the submission without losing a paise', () => {
    const lines = [
      line('PER_GUEST', 45_000, 1, 'catering'),
      line('PER_UNIT', 150_000, 2, 'catering'),
      line('FLAT', 4_500_000, 1, 'decor'),
      line('PER_GUEST', 600_000, 1, 'makeup'),
    ]
    const groups = groupByService(lines)
    expect(groups.map((g) => g.serviceKey)).toEqual(['catering', 'decor', 'makeup'])
    expect(groups[0]!.amountPaise).toBe(11_250_000 + 300_000)
    expect(groups[1]!.amountPaise).toBe(4_500_000)
    expect(groups[2]!.amountPaise).toBe(150_000_000)
    expect(totalPaise(lines)).toBe(11_250_000 + 300_000 + 4_500_000 + 150_000_000)
  })

  it('returns no groups for an empty submission', () => {
    expect(groupByService([])).toEqual([])
    expect(totalPaise([])).toBe(0)
  })
})
