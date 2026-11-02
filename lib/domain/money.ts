/**
 * Money is integer paise everywhere. Floats never touch a stored total.
 * ₹1 = 100 paise.
 */

export const PAISE_PER_RUPEE = 100

/** Round half away from zero, the convention used on Indian tax invoices. */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value < 0 ? -Math.round(-value) : Math.round(value)
}

export function rupeesToPaise(rupees: number): number {
  return roundHalfUp(rupees * PAISE_PER_RUPEE)
}

export function paiseToRupees(paise: number): number {
  return paise / PAISE_PER_RUPEE
}

/** Nearest whole rupee, for the invoice round-off line. */
export function roundToRupee(paise: number): number {
  return roundHalfUp(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE
}

export function clampPaise(value: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(roundHalfUp(value), min), max)
}

/**
 * Format paise for display. Uses the Indian digit grouping (1,12,500).
 * Fractions are hidden when the amount is a whole rupee so dense tables stay legible.
 */
export function formatINR(
  paise: number,
  options: { showPaise?: boolean; compact?: boolean } = {},
): string {
  const { showPaise = false, compact = false } = options
  const amount = paiseToRupees(paise)

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showPaise ? 2 : 0,
    minimumFractionDigits: showPaise ? 2 : 0,
    notation: compact ? 'compact' : 'standard',
  })

  return formatter.format(amount)
}

/** Parse a user-typed rupee amount ("1,250.50", "₹1250") into paise. */
export function parseRupees(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '')
  if (cleaned === '' || !/^-?\d*(\.\d{0,2})?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return rupeesToPaise(value)
}

/** Basis points: 5% = 500 bp, 18% = 1800 bp. */
export function percentToBp(percent: number): number {
  return roundHalfUp(percent * 100)
}

export function bpToPercent(bp: number): number {
  return bp / 100
}

export function formatPercentBp(bp: number): string {
  const percent = bpToPercent(bp)
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`
}
