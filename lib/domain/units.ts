/**
 * Billing units are typed, never free text.
 *
 * A tenant may name a unit anything ("per tub", "per crate", "per coverage day"),
 * but every unit maps to exactly one calculation class. This is what keeps a
 * photographer's day rate, a decorator's setup fee and a caterer's per-plate
 * price inside one engine, with no per-vertical branching in the maths.
 */

export const UNIT_CLASSES = [
  {
    key: 'PER_GUEST',
    label: 'Per guest',
    measureLabel: 'guests',
    multipliesByGuests: true,
  },
  {
    key: 'PER_UNIT',
    label: 'Per item / quantity',
    measureLabel: 'units',
    multipliesByGuests: false,
  },
  {
    key: 'FLAT',
    label: 'Fixed amount',
    measureLabel: 'package',
    multipliesByGuests: false,
  },
  {
    key: 'PER_HOUR',
    label: 'Per hour',
    measureLabel: 'hours',
    multipliesByGuests: false,
  },
  {
    key: 'PER_DAY',
    label: 'Per day / shift',
    measureLabel: 'days',
    multipliesByGuests: false,
  },
] as const

export type UnitClass = (typeof UNIT_CLASSES)[number]['key']

const UNIT_CLASS_SET: ReadonlySet<string> = new Set(UNIT_CLASSES.map((u) => u.key))

export function isUnitClass(value: unknown): value is UnitClass {
  return typeof value === 'string' && UNIT_CLASS_SET.has(value)
}

export function unitClassMeta(unitClass: UnitClass) {
  const found = UNIT_CLASSES.find((u) => u.key === unitClass)
  // The list above is exhaustive over the union, so this cannot be undefined.
  return found ?? UNIT_CLASSES[0]
}

export function unitClassLabel(unitClass: UnitClass): string {
  return unitClassMeta(unitClass).label
}

/**
 * The multiplier a line is priced at.
 *
 * `minQuantity` is enforced here, not in the UI: a package with a 100-guest
 * minimum quoted for 30 guests bills 100. That defect exists in the prototype
 * (`minGuests` stored but never read by the totals) and must not be repeated.
 */
export function quantityBasis(
  unitClass: UnitClass,
  params: { guests: number; quantity: number; minQuantity?: number | null },
): { basis: number; minApplied: boolean } {
  const guests = Math.max(0, Math.trunc(params.guests))
  const minimum = Math.max(0, Math.trunc(params.minQuantity ?? 0))

  if (unitClass === 'PER_GUEST') {
    const basis = Math.max(guests, minimum)
    return { basis, minApplied: basis > guests && minimum > 0 }
  }

  if (unitClass === 'FLAT') {
    return { basis: 1, minApplied: false }
  }

  const quantity = Math.max(0, params.quantity)
  const basis = Math.max(quantity, minimum)
  return { basis, minApplied: basis > quantity && minimum > 0 }
}
