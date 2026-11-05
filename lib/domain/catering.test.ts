import { describe, expect, it } from 'vitest'
import {
  aggregateIngredients,
  eventCateringTotals,
  formatMilliQuantity,
  lineAmountPaise,
  sessionTotals,
  validateSelection,
  type RecipeRow,
} from './catering'

const rule = { minSelections: 2, maxSelections: 4, required: true }

describe('validateSelection', () => {
  it('rejects below the minimum', () => {
    expect(validateSelection(rule, 1)).toMatchObject({ ok: false, reason: 'below_minimum' })
  })

  it('accepts a count inside the range', () => {
    expect(validateSelection(rule, 2)).toEqual({ ok: true, count: 2 })
    expect(validateSelection(rule, 4)).toEqual({ ok: true, count: 4 })
  })

  it('rejects above the maximum', () => {
    expect(validateSelection(rule, 5)).toMatchObject({ ok: false, reason: 'above_maximum' })
  })

  it('treats a null maximum as unlimited, not zero', () => {
    const unlimited = { minSelections: 0, maxSelections: null, required: false }
    expect(validateSelection(unlimited, 40)).toEqual({ ok: true, count: 40 })
    expect(validateSelection(unlimited, 0)).toEqual({ ok: true, count: 0 })
  })

  it('allows an empty optional category', () => {
    const optional = { minSelections: 0, maxSelections: 3, required: false }
    expect(validateSelection(optional, 0)).toEqual({ ok: true, count: 0 })
  })

  it('rejects an empty required category even when the minimum is zero', () => {
    const required = { minSelections: 0, maxSelections: 3, required: true }
    expect(validateSelection(required, 0)).toMatchObject({ ok: false, reason: 'required' })
  })

  it('supports an exact count (min === max)', () => {
    const exact = { minSelections: 3, maxSelections: 3, required: true }
    expect(validateSelection(exact, 2)).toMatchObject({ ok: false })
    expect(validateSelection(exact, 3)).toEqual({ ok: true, count: 3 })
    expect(validateSelection(exact, 4)).toMatchObject({ ok: false })
  })
})

describe('session pricing', () => {
  it('prices per guest by the session guest count, not a shared event count', () => {
    const lunch = sessionTotals({
      guests: 500,
      lines: [{ id: '1', label: 'Meal', unitClass: 'PER_GUEST', unitPricePaise: 45_000, quantity: 1 }],
    })
    const snacks = sessionTotals({
      guests: 300,
      lines: [{ id: '2', label: 'Snacks', unitClass: 'PER_GUEST', unitPricePaise: 12_000, quantity: 1 }],
    })

    expect(lunch.subtotalPaise).toBe(45_000 * 500)
    expect(snacks.subtotalPaise).toBe(12_000 * 300)
    expect(eventCateringTotals([lunch, snacks])).toMatchObject({
      sessionCount: 2,
      guests: 800,
      subtotalPaise: 45_000 * 500 + 12_000 * 300,
    })
  })

  it('multiplies non-guest classes by quantity only', () => {
    const line = {
      id: '1',
      label: 'Hot case',
      unitClass: 'PER_UNIT' as const,
      unitPricePaise: 120_000,
      quantity: 4,
    }
    expect(lineAmountPaise(line, 500)).toBe(480_000)
  })

  it('charges a flat line once regardless of guests', () => {
    const flat = {
      id: '1',
      label: 'Transport',
      unitClass: 'FLAT' as const,
      unitPricePaise: 350_000,
      quantity: 1,
    }
    expect(lineAmountPaise(flat, 900)).toBe(350_000)
  })

  it('adds tax once over the session subtotal and keeps subtotal + tax = total', () => {
    const totals = sessionTotals({
      guests: 100,
      taxRateBp: 500,
      lines: [
        { id: '1', label: 'Meal', unitClass: 'PER_GUEST', unitPricePaise: 45_000, quantity: 1 },
        { id: '2', label: 'Counter', unitClass: 'FLAT', unitPricePaise: 100_000, quantity: 1 },
      ],
    })
    expect(totals.subtotalPaise).toBe(4_600_000)
    expect(totals.taxPaise).toBe(230_000)
    expect(totals.subtotalPaise + totals.taxPaise).toBe(totals.totalPaise)
  })

  it('prices an empty session at zero', () => {
    const totals = sessionTotals({ guests: 50, lines: [] })
    expect(totals.totalPaise).toBe(0)
  })
})

describe('recipe demand', () => {
  const rice: RecipeRow = {
    name: 'Sona masoori rice',
    unit: 'g',
    quantityMilliPerServing: 180_000,
    wastageBp: 500,
  }

  it('scales by servings and reports wastage separately', () => {
    const [demand] = aggregateIngredients([{ ...rice, servings: 100 }])
    expect(demand?.requiredMilli).toBe(18_000_000)
    expect(demand?.wastageMilli).toBe(900_000)
    expect(demand?.totalMilli).toBe(18_900_000)
  })

  it('merges the same ingredient across sessions with different guest counts', () => {
    const rows = [
      { ...rice, servings: 500 },
      { ...rice, servings: 300 },
    ]
    const demand = aggregateIngredients(rows)
    expect(demand).toHaveLength(1)
    expect(demand[0]?.lines).toBe(2)
    expect(demand[0]?.requiredMilli).toBe(180_000 * 800)
  })

  it('keeps grams and millilitres apart', () => {
    const demand = aggregateIngredients([
      { ...rice, servings: 10 },
      { name: 'Sona masoori rice', unit: 'ml', quantityMilliPerServing: 1000, wastageBp: 0, servings: 10 },
    ])
    expect(demand).toHaveLength(2)
  })

  it('ignores rows with no quantity or no servings', () => {
    expect(aggregateIngredients([{ ...rice, servings: 0 }])).toHaveLength(0)
    expect(aggregateIngredients([{ ...rice, quantityMilliPerServing: 0, servings: 10 }])).toHaveLength(0)
  })

  it('formats thousands as kilograms and litres', () => {
    expect(formatMilliQuantity(1_250_000, 'g')).toBe('1.25 kg')
    expect(formatMilliQuantity(250_000, 'g')).toBe('250 g')
    expect(formatMilliQuantity(2_000_000, 'ml')).toBe('2 L')
    expect(formatMilliQuantity(12_000, 'piece')).toBe('12 pcs')
  })
})
