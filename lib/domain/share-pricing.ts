/**
 * Indicative pricing for the public share portal.
 *
 * Pure and integer-only, so the browser preview and the server's authoritative
 * calculation cannot disagree. The server always recomputes: a browser-submitted
 * amount is never stored.
 */

import { quantityBasis, type UnitClass } from './units'

export interface PricedSelection {
  readonly itemId: string
  readonly serviceKey: string
  readonly label: string
  readonly unitClass: UnitClass
  readonly quantity: number
  readonly unitPricePaise: number
  readonly basis: number
  readonly amountPaise: number
}

export interface ServiceSubtotal {
  readonly serviceKey: string
  readonly amountPaise: number
  readonly lines: readonly PricedSelection[]
}

/** What one line is multiplied by, before any price is applied. */
export function basisForUnit(unitClass: UnitClass, guests: number, quantity: number): number {
  return quantityBasis(unitClass, { guests, quantity }).basis
}

/** The amount a single chosen item contributes, in paise. Never negative. */
export function priceSelection(
  selection: {
    itemId: string
    serviceKey: string
    label: string
    unitClass: UnitClass
    quantity: number
    unitPricePaise: number
  },
  guests: number,
): PricedSelection {
  const quantity = Math.max(1, Math.trunc(selection.quantity))
  const basis = basisForUnit(selection.unitClass, Math.max(0, Math.trunc(guests)), quantity)
  const unitPricePaise = Math.max(0, Math.trunc(selection.unitPricePaise))
  return {
    itemId: selection.itemId,
    serviceKey: selection.serviceKey,
    label: selection.label,
    unitClass: selection.unitClass,
    quantity,
    unitPricePaise,
    basis,
    amountPaise: Math.max(0, Math.round(unitPricePaise * basis)),
  }
}

/** Group lines by service and total both levels. Order follows first appearance. */
export function groupByService(lines: readonly PricedSelection[]): ServiceSubtotal[] {
  const groups = new Map<string, PricedSelection[]>()
  for (const line of lines) {
    const bucket = groups.get(line.serviceKey) ?? []
    bucket.push(line)
    groups.set(line.serviceKey, bucket)
  }
  return [...groups.entries()].map(([serviceKey, serviceLines]) => ({
    serviceKey,
    amountPaise: serviceLines.reduce((sum, line) => sum + line.amountPaise, 0),
    lines: serviceLines,
  }))
}

export function totalPaise(lines: readonly PricedSelection[]): number {
  return lines.reduce((sum, line) => sum + line.amountPaise, 0)
}
