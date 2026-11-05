/**
 * The catering engines. Pure, integer arithmetic, no database.
 *
 * Three rules that must not be re-derived in a component:
 *   1. A selection limit is data. `maxSelections: null` means unlimited; zero
 *      selections may still be legal (an optional category), and `required`
 *      alone can make an empty selection wrong.
 *   2. A session is priced with its own guest count. A wedding with 500 at lunch
 *      and 300 at dinner must not bill 500 twice.
 *   3. A recipe row scales by servings and then by its wastage allowance, so the
 *      5% trim loss is visible in the number instead of being folded into it.
 */

import { roundHalfUp } from './money'
import { quantityBasis, type UnitClass } from './units'

// ---------------------------------------------------------------------------
// Selection rules
// ---------------------------------------------------------------------------

export interface SelectionRule {
  readonly minSelections: number
  /** null = unlimited. Never read as zero. */
  readonly maxSelections: number | null
  readonly required: boolean
}

export type SelectionVerdict =
  | { readonly ok: true; readonly count: number }
  | {
      readonly ok: false
      readonly reason: 'below_minimum' | 'above_maximum' | 'required'
      readonly message: string
    }

export function isUnlimited(rule: Pick<SelectionRule, 'maxSelections'>): boolean {
  return rule.maxSelections === null
}

/** Returns a verdict, never throws: the caller decides how to surface it. */
export function validateSelection(rule: SelectionRule, selected: number): SelectionVerdict {
  const count = Math.max(0, Math.trunc(selected))
  const min = Math.max(0, Math.trunc(rule.minSelections))

  if (rule.maxSelections !== null && count > rule.maxSelections) {
    return {
      ok: false,
      reason: 'above_maximum',
      message: `Choose at most ${rule.maxSelections} here; ${count} selected.`,
    }
  }

  if (count === 0 && rule.required) {
    return { ok: false, reason: 'required', message: 'This category is required.' }
  }

  if (count < min) {
    return {
      ok: false,
      reason: 'below_minimum',
      message: `Choose at least ${min} here; ${count} selected.`,
    }
  }

  return { ok: true, count }
}

/** Human summary of a rule for tables and pickers. */
export function describeRule(rule: SelectionRule): string {
  if (rule.maxSelections === null) {
    return rule.minSelections > 0 ? `At least ${rule.minSelections}` : 'Any number'
  }
  if (rule.maxSelections === rule.minSelections) return `Exactly ${rule.minSelections}`
  return `${rule.minSelections}–${rule.maxSelections}`
}

// ---------------------------------------------------------------------------
// Session pricing
// ---------------------------------------------------------------------------

export interface SessionLineInput {
  readonly id: string
  readonly label: string
  readonly unitClass: UnitClass
  readonly unitPricePaise: number
  /** Units/trays counted. Ignored by PER_GUEST and FLAT, like `quantityBasis`. */
  readonly quantity: number
  readonly dietary?: string | null
}

export interface SessionLineTotals extends SessionLineInput {
  readonly basis: number
  readonly amountPaise: number
}

export interface SessionTotals {
  readonly guests: number
  readonly lines: readonly SessionLineTotals[]
  readonly subtotalPaise: number
  readonly taxRateBp: number
  readonly taxPaise: number
  readonly totalPaise: number
}

export interface SessionTotalsInput {
  readonly guests: number
  readonly lines: readonly SessionLineInput[]
  /** Session-level tax in basis points; 0 when the tenant is not registered. */
  readonly taxRateBp?: number
}

/** One line's amount, using only the guest basis for guest-priced classes. */
export function lineAmountPaise(line: SessionLineInput, guests: number): number {
  const { basis } = quantityBasis(line.unitClass, {
    guests,
    quantity: line.quantity,
  })
  return Math.max(0, Math.round(line.unitPricePaise * basis))
}

export function sessionTotals(input: SessionTotalsInput): SessionTotals {
  const guests = Math.max(0, Math.trunc(input.guests))
  const taxRateBp = Math.max(0, Math.trunc(input.taxRateBp ?? 0))

  const lines: SessionLineTotals[] = input.lines.map((line) => {
    const { basis } = quantityBasis(line.unitClass, { guests, quantity: line.quantity })
    return { ...line, basis, amountPaise: Math.max(0, Math.round(line.unitPricePaise * basis)) }
  })

  const subtotalPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0)
  const taxPaise = roundHalfUp((subtotalPaise * taxRateBp) / 10_000)

  return { guests, lines, subtotalPaise, taxRateBp, taxPaise, totalPaise: subtotalPaise + taxPaise }
}

/** Sum over sessions that each carry their own guest count. */
export function eventCateringTotals(sessions: readonly SessionTotals[]): {
  readonly sessionCount: number
  readonly guests: number
  readonly subtotalPaise: number
  readonly taxPaise: number
  readonly totalPaise: number
} {
  return {
    sessionCount: sessions.length,
    guests: sessions.reduce((sum, session) => sum + session.guests, 0),
    subtotalPaise: sessions.reduce((sum, session) => sum + session.subtotalPaise, 0),
    taxPaise: sessions.reduce((sum, session) => sum + session.taxPaise, 0),
    totalPaise: sessions.reduce((sum, session) => sum + session.totalPaise, 0),
  }
}

// ---------------------------------------------------------------------------
// Recipes and ingredient demand
// ---------------------------------------------------------------------------

export type IngredientUnit = 'g' | 'ml' | 'piece'

export const INGREDIENT_UNITS: readonly { key: IngredientUnit; label: string }[] = [
  { key: 'g', label: 'grams' },
  { key: 'ml', label: 'millilitres' },
  { key: 'piece', label: 'pieces' },
]

export function isIngredientUnit(value: unknown): value is IngredientUnit {
  return value === 'g' || value === 'ml' || value === 'piece'
}

export interface RecipeRow {
  /** Stable identity when it exists, else the normalised name is the key. */
  readonly inventoryItemId?: string | null
  readonly name: string
  readonly unit: IngredientUnit
  /** Thousandths of the unit consumed by one served portion. */
  readonly quantityMilliPerServing: number
  /** Basis points, 500 = 5%. */
  readonly wastageBp: number
}

export interface IngredientDemand {
  readonly key: string
  readonly name: string
  readonly unit: IngredientUnit
  readonly requiredMilli: number
  readonly wastageMilli: number
  readonly totalMilli: number
  readonly lines: number
}

function demandKey(row: RecipeRow): string {
  const name = row.name.trim().toLowerCase().replace(/\s+/g, ' ')
  return row.inventoryItemId ? `id:${row.inventoryItemId}` : `name:${name}|${row.unit}`
}

/**
 * Aggregate recipe rows across one or more sessions.
 *
 * Each row carries its own `servings` because sessions have different guest
 * counts. Wastage is applied per row and reported separately, so a production
 * sheet can show "240 kg rice, 12 kg trim loss" rather than one silent number.
 */
export function aggregateIngredients(
  rows: readonly (RecipeRow & { readonly servings: number })[],
): IngredientDemand[] {
  const byKey = new Map<string, IngredientDemand & { wastageMilli: number }>()

  for (const row of rows) {
    const servings = Math.max(0, Math.trunc(row.servings))
    const perServing = Math.max(0, Math.trunc(row.quantityMilliPerServing))
    if (servings === 0 || perServing === 0) continue

    const required = perServing * servings
    const wastage = roundHalfUp((required * Math.max(0, Math.trunc(row.wastageBp))) / 10_000)
    const key = demandKey(row)
    const existing = byKey.get(key)

    if (existing) {
      byKey.set(key, {
        ...existing,
        requiredMilli: existing.requiredMilli + required,
        wastageMilli: existing.wastageMilli + wastage,
        totalMilli: existing.totalMilli + required + wastage,
        lines: existing.lines + 1,
      })
    } else {
      byKey.set(key, {
        key,
        name: row.name.trim(),
        unit: row.unit,
        requiredMilli: required,
        wastageMilli: wastage,
        totalMilli: required + wastage,
        lines: 1,
      })
    }
  }

  return [...byKey.values()]
    .map(({ key, name, unit, requiredMilli, wastageMilli, totalMilli, lines }) => ({
      key,
      name,
      unit,
      requiredMilli,
      wastageMilli,
      totalMilli,
      lines,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** 1.25 kg from 1_250_000 milli-grams. Trim, never pad, the display. */
export function formatMilliQuantity(milli: number, unit: IngredientUnit): string {
  const value = milli / 1000
  const text = value.toLocaleString('en-IN', { maximumFractionDigits: 3 })
  if (unit === 'g') return value >= 1000 ? `${(value / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg` : `${text} g`
  if (unit === 'ml') return value >= 1000 ? `${(value / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 })} L` : `${text} ml`
  return `${text} pcs`
}
