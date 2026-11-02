import { describe, expect, it } from 'vitest'
import { computeQuote, groupByService, type PriceLineInput, type QuoteInput } from './pricing'

const cateringInput: QuoteInput = {
  guests: 250,
  lines: [
    {
      id: 'l1',
      serviceKey: 'catering',
      label: 'Traditional vegetarian meal',
      unitClass: 'PER_GUEST',
      unitRatePaise: 45_000,
      quantity: 0,
      minQuantity: 100,
      taxRateBp: 500,
      costPerUnitPaise: 30_000,
    },
    {
      id: 'l2',
      serviceKey: 'catering',
      label: 'Live dosa counter',
      unitClass: 'PER_GUEST',
      unitRatePaise: 12_000,
      quantity: 0,
      taxRateBp: 500,
      costPerUnitPaise: 5_000,
    },
    {
      id: 'l3',
      serviceKey: 'catering',
      label: 'Transport',
      unitClass: 'FLAT',
      unitRatePaise: 250_000,
      quantity: 1,
      taxRateBp: 500,
      costPerUnitPaise: 200_000,
    },
  ],
  orderDiscount: { kind: 'percent', value: 5, reason: 'Repeat client' },
}

const photographyInput: QuoteInput = {
  guests: 0,
  lines: [
    {
      id: 'p1',
      serviceKey: 'photography',
      label: 'Full-day wedding coverage',
      unitClass: 'FLAT',
      unitRatePaise: 3_500_000,
      quantity: 1,
      taxRateBp: 1800,
    },
    {
      id: 'p2',
      serviceKey: 'photography',
      label: 'Second photographer',
      unitClass: 'PER_DAY',
      unitRatePaise: 800_000,
      quantity: 2,
      taxRateBp: 1800,
    },
    {
      id: 'p3',
      serviceKey: 'photography',
      label: 'Premium album',
      unitClass: 'PER_UNIT',
      unitRatePaise: 450_000,
      quantity: 1,
      taxRateBp: 1800,
    },
  ],
}

describe('computeQuote — catering fixture', () => {
  const result = computeQuote(cateringInput)

  it('bills the package at the guest count and applies the 5% order discount', () => {
    expect(result.subtotalPaise).toBe(14_500_000)
    expect(result.discountPaise).toBe(725_000)
    expect(result.taxableBasePaise).toBe(13_775_000)
  })

  it('computes 5% GST per line and a rupee round-off line', () => {
    expect(result.taxPaise).toBe(688_750)
    expect(result.roundOffPaise).toBe(50)
    expect(result.totalPaise).toBe(14_463_800)
  })

  it('reports cost and margin from per-unit cost', () => {
    expect(result.costPaise).toBe(8_950_000)
    expect(result.marginPaise).toBe(4_825_000)
    expect(result.marginBp).toBe(3503)
  })
})

describe('computeQuote — photography fixture', () => {
  const result = computeQuote(photographyInput)

  it('prices flat, per-day and per-unit lines through the same engine', () => {
    expect(result.subtotalPaise).toBe(5_550_000)
    expect(result.taxPaise).toBe(999_000)
    expect(result.roundOffPaise).toBe(0)
    expect(result.totalPaise).toBe(6_549_000)
  })

  it('groups lines by the service that produced them', () => {
    const groups = groupByService(result.lines)
    expect(groups).toHaveLength(1)
    expect(groups[0]?.serviceKey).toBe('photography')
    expect(groups[0]?.totalPaise).toBe(6_549_000)
  })
})

describe('guarantees', () => {
  it('never lets subtotal + tax + round-off drift from the total', () => {
    for (const input of [cateringInput, photographyInput]) {
      const r = computeQuote(input)
      expect(r.subtotalPaise - r.discountPaise + r.taxPaise + r.roundOffPaise).toBe(r.totalPaise)
    }
  })

  it('never decreases the total when a positive line is added', () => {
    const base = computeQuote(photographyInput)
    const extra: PriceLineInput = {
      id: 'p4',
      serviceKey: 'photography',
      label: 'Drone coverage',
      unitClass: 'FLAT',
      unitRatePaise: 900_000,
      quantity: 1,
      taxRateBp: 1800,
    }
    const grown = computeQuote({ ...photographyInput, lines: [...photographyInput.lines, extra] })
    expect(grown.totalPaise).toBeGreaterThan(base.totalPaise)
  })

  it('clamps an over-sized discount to zero and reports it', () => {
    const result = computeQuote({
      guests: 0,
      lines: photographyInput.lines,
      orderDiscount: { kind: 'amount', value: 99_999_999 },
    })
    expect(result.discountPaise).toBe(result.subtotalPaise)
    expect(result.discountClamped).toBe(true)
    expect(result.totalPaise).toBe(0)
  })

  it('prices an item already covered by the package at zero, with no tax', () => {
    const result = computeQuote({
      guests: 250,
      lines: [
        {
          id: 'pkg',
          serviceKey: 'catering',
          label: 'Wedding package',
          unitClass: 'PER_GUEST',
          unitRatePaise: 45_000,
          quantity: 0,
          taxRateBp: 500,
        },
        {
          id: 'inc',
          serviceKey: 'catering',
          label: 'Dessert (included)',
          unitClass: 'PER_GUEST',
          unitRatePaise: 9_000,
          quantity: 0,
          includedInPackage: true,
          taxRateBp: 500,
        },
      ],
    })
    expect(result.lines[1]?.grossPaise).toBe(0)
    expect(result.lines[1]?.taxPaise).toBe(0)
    expect(result.subtotalPaise).toBe(11_250_000)
  })

  it('enforces the package minimum guest count and flags it', () => {
    const result = computeQuote({
      guests: 30,
      lines: [
        {
          id: 'pkg',
          serviceKey: 'catering',
          label: 'Wedding package',
          unitClass: 'PER_GUEST',
          unitRatePaise: 45_000,
          quantity: 0,
          minQuantity: 100,
          taxRateBp: 500,
        },
      ],
    })
    expect(result.lines[0]?.basis).toBe(100)
    expect(result.lines[0]?.minQuantityApplied).toBe(true)
    expect(result.subtotalPaise).toBe(4_500_000)
  })

  it('holds the invariants across a deterministic spread of inputs', () => {
    for (let i = 1; i <= 300; i += 1) {
      const line: PriceLineInput = {
        id: `r${i}`,
        serviceKey: i % 2 === 0 ? 'catering' : 'decor',
        label: 'generated',
        unitClass: i % 3 === 0 ? 'PER_UNIT' : i % 3 === 1 ? 'PER_GUEST' : 'FLAT',
        unitRatePaise: i * 137,
        quantity: i % 40,
        minQuantity: i % 7 === 0 ? 20 : 0,
        taxRateBp: (i % 4) * 500,
        costPerUnitPaise: i * 61,
      }
      const result = computeQuote({
        guests: i * 3,
        lines: [line],
        orderDiscount: { kind: 'percent', value: i % 11 },
      })

      expect(result.totalPaise).toBeGreaterThanOrEqual(0)
      expect(result.subtotalPaise - result.discountPaise + result.taxPaise + result.roundOffPaise).toBe(
        result.totalPaise,
      )
      expect(Number.isInteger(result.totalPaise)).toBe(true)
    }
  })
})
