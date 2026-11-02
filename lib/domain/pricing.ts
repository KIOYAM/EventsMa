/**
 * The pricing engine. Pure, vertical-agnostic, integer paise.
 *
 * Invariants (property-tested):
 *   1. subtotal + tax + roundOff === total, exactly.
 *   2. Adding a non-negative line never decreases the total.
 *   3. No discount can push a total below zero; clamping is reported, never hidden.
 *   4. A line marked "included in package" contributes zero and is not taxed.
 *   5. The client may preview; only this function may decide a stored total.
 */

import { clampPaise, roundHalfUp, roundToRupee } from './money'
import { quantityBasis, type UnitClass } from './units'

export interface PriceLineInput {
  readonly id: string
  readonly serviceKey: string
  readonly label: string
  readonly unitClass: UnitClass
  readonly unitRatePaise: number
  /** Units, hours or days. Ignored for PER_GUEST and FLAT. */
  readonly quantity: number
  readonly minQuantity?: number | null
  /** True when the package already covers this item: shown, priced at zero. */
  readonly includedInPackage?: boolean
  /** Tax in basis points, e.g. 500 for 5%, 1800 for 18%. */
  readonly taxRateBp: number
  readonly costPerUnitPaise?: number
}

export interface OrderDiscount {
  readonly kind: 'amount' | 'percent'
  readonly value: number
  readonly reason?: string
}

export interface QuoteInput {
  readonly guests: number
  readonly lines: readonly PriceLineInput[]
  readonly orderDiscount?: OrderDiscount | null
}

export interface LineComputation {
  readonly id: string
  readonly serviceKey: string
  readonly label: string
  readonly unitClass: UnitClass
  readonly basis: number
  readonly unitRatePaise: number
  readonly grossPaise: number
  readonly discountPaise: number
  readonly taxablePaise: number
  readonly taxRateBp: number
  readonly taxPaise: number
  readonly totalPaise: number
  readonly costPaise: number
  readonly marginPaise: number
  readonly included: boolean
  readonly minQuantityApplied: boolean
}

export interface QuoteComputation {
  readonly lines: readonly LineComputation[]
  readonly subtotalPaise: number
  readonly discountPaise: number
  readonly discountClamped: boolean
  readonly taxableBasePaise: number
  readonly taxPaise: number
  readonly roundOffPaise: number
  readonly totalPaise: number
  readonly costPaise: number
  readonly marginPaise: number
  readonly marginBp: number
}

/**
 * Split an order-level discount across lines in proportion to their gross amount,
 * using largest-remainder so the parts sum exactly to the whole.
 */
function allocateDiscount(
  discountPaise: number,
  weights: readonly number[],
): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  if (discountPaise <= 0 || totalWeight <= 0) return weights.map(() => 0)

  const exact = weights.map((w) => (w * discountPaise) / totalWeight)
  const floored = exact.map((v) => Math.floor(v))
  let remainder = discountPaise - floored.reduce((sum, v) => sum + v, 0)

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)

  const result = [...floored]
  for (const { index } of order) {
    if (remainder <= 0) break
    result[index] = (result[index] ?? 0) + 1
    remainder -= 1
  }
  return result
}

export function computeQuote(input: QuoteInput): QuoteComputation {
  const guests = Math.max(0, Math.trunc(input.guests))

  const prepared = input.lines.map((line) => {
    const { basis, minApplied } = quantityBasis(line.unitClass, {
      guests,
      quantity: line.quantity,
      minQuantity: line.minQuantity,
    })

    const included = line.includedInPackage === true
    const gross = included
      ? 0
      : clampPaise(roundHalfUp(Math.max(0, line.unitRatePaise) * basis))

    const cost = clampPaise(roundHalfUp(Math.max(0, line.costPerUnitPaise ?? 0) * basis))

    return { line, basis, minApplied, included, gross, cost }
  })

  const subtotalPaise = prepared.reduce((sum, p) => sum + p.gross, 0)

  const rawDiscount = (() => {
    const discount = input.orderDiscount
    if (!discount || discount.value <= 0) return 0
    if (discount.kind === 'percent') {
      const pct = Math.min(100, Math.max(0, discount.value))
      return roundHalfUp((subtotalPaise * pct) / 100)
    }
    return roundHalfUp(discount.value)
  })()

  const discountPaise = Math.min(Math.max(0, rawDiscount), subtotalPaise)
  const discountClamped = rawDiscount > subtotalPaise || (input.orderDiscount?.value ?? 0) < 0

  const allocations = allocateDiscount(
    discountPaise,
    prepared.map((p) => p.gross),
  )

  const lines: LineComputation[] = prepared.map((p, index) => {
    const lineDiscount = allocations[index] ?? 0
    const taxable = Math.max(0, p.gross - lineDiscount)
    const tax = p.included ? 0 : clampPaise(roundHalfUp((taxable * p.line.taxRateBp) / 10_000))

    return {
      id: p.line.id,
      serviceKey: p.line.serviceKey,
      label: p.line.label,
      unitClass: p.line.unitClass,
      basis: p.basis,
      unitRatePaise: p.line.unitRatePaise,
      grossPaise: p.gross,
      discountPaise: lineDiscount,
      taxablePaise: taxable,
      taxRateBp: p.line.taxRateBp,
      taxPaise: tax,
      totalPaise: taxable + tax,
      costPaise: p.cost,
      marginPaise: taxable - p.cost,
      included: p.included,
      minQuantityApplied: p.minApplied,
    }
  })

  const taxableBasePaise = lines.reduce((sum, l) => sum + l.taxablePaise, 0)
  const taxPaise = lines.reduce((sum, l) => sum + l.taxPaise, 0)
  const costPaise = lines.reduce((sum, l) => sum + l.costPaise, 0)

  const beforeRoundOff = taxableBasePaise + taxPaise
  const totalPaise = roundToRupee(beforeRoundOff)
  const roundOffPaise = totalPaise - beforeRoundOff

  const marginPaise = taxableBasePaise - costPaise
  const marginBp = taxableBasePaise > 0 ? roundHalfUp((marginPaise * 10_000) / taxableBasePaise) : 0

  return {
    lines,
    subtotalPaise,
    discountPaise,
    discountClamped,
    taxableBasePaise,
    taxPaise,
    roundOffPaise,
    totalPaise,
    costPaise,
    marginPaise,
    marginBp,
  }
}

/** Group computed lines by the service that produced them. */
export function groupByService(
  lines: readonly LineComputation[],
): { serviceKey: string; lines: LineComputation[]; subtotalPaise: number; totalPaise: number }[] {
  const groups = new Map<string, LineComputation[]>()
  for (const line of lines) {
    const bucket = groups.get(line.serviceKey) ?? []
    bucket.push(line)
    groups.set(line.serviceKey, bucket)
  }
  return [...groups.entries()].map(([serviceKey, groupLines]) => ({
    serviceKey,
    lines: groupLines,
    subtotalPaise: groupLines.reduce((sum, l) => sum + l.grossPaise, 0),
    totalPaise: groupLines.reduce((sum, l) => sum + l.totalPaise, 0),
  }))
}
