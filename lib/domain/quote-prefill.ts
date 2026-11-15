import type { UnitClass } from './units'

/**
 * A customer submission, shaped for the composer.
 *
 * Kept in `lib/domain` rather than beside the query so the client component can
 * name the type without importing a `server-only` module.
 */
export interface ComposerPrefillLine {
  serviceKey: string
  label: string
  unitClass: UnitClass
  unitRatePaise: number
  quantity: number
  taxRateBp: number
  costPerUnitPaise: number | null
}

export interface ComposerPrefill {
  submissionId: string
  eventId: string | null
  title: string
  eventDate: string
  guests: number
  clientId: string | null
  venueName: string | null
  lines: ComposerPrefillLine[]
}
