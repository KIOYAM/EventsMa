/**
 * Service verticals are DATA, not code paths.
 *
 * The platform owns this catalogue. A tenant enables the verticals it actually
 * provides and configures each one; a new vertical is a new descriptor row, not a
 * deployment. `GENERIC_VERTICAL` is the fallback for a specialist service the
 * platform has never seen, which is how EventsMa supports a planner who offers
 * everything plus a business that offers one unusual thing.
 */

import type { UnitClass } from './units'

export interface VerticalConfigField {
  readonly key: string
  readonly label: string
  readonly hint?: string
  readonly kind: 'text' | 'number' | 'textarea'
}

export interface VerticalDescriptor {
  readonly key: string
  readonly label: string
  /** What a catalogue row is called in this vertical: "dish", "coverage package". */
  readonly itemNoun: string
  readonly packageNoun: string
  readonly resourceNoun: string
  readonly defaultUnitClass: UnitClass
  readonly allowedUnitClasses: readonly UnitClass[]
  readonly defaultTaxRateBp: number
  readonly configFields: readonly VerticalConfigField[]
  readonly seedItems: readonly { name: string; unitClass: UnitClass; pricePaise: number }[]
}

export const GENERIC_VERTICAL: VerticalDescriptor = {
  key: 'specialist',
  label: 'Specialist service',
  itemNoun: 'catalogue item',
  packageNoun: 'service package',
  resourceNoun: 'asset',
  defaultUnitClass: 'FLAT',
  allowedUnitClasses: ['FLAT', 'PER_UNIT', 'PER_HOUR', 'PER_DAY', 'PER_GUEST'],
  defaultTaxRateBp: 1800,
  configFields: [
    { key: 'scope', label: 'Scope of work', kind: 'textarea', hint: 'What is included, in plain language.' },
    { key: 'exclusions', label: 'Exclusions', kind: 'textarea', hint: 'What is explicitly not included.' },
    { key: 'credentials', label: 'Licences or credentials', kind: 'text' },
    { key: 'acceptance', label: 'Acceptance criteria', kind: 'text', hint: 'What counts as delivered.' },
  ],
  seedItems: [],
}

export const VERTICAL_CATALOG: readonly VerticalDescriptor[] = [
  {
    key: 'catering',
    label: 'Catering & food service',
    itemNoun: 'dish',
    packageNoun: 'menu package',
    resourceNoun: 'counter or equipment',
    defaultUnitClass: 'PER_GUEST',
    allowedUnitClasses: ['PER_GUEST', 'PER_UNIT', 'FLAT'],
    defaultTaxRateBp: 500,
    configFields: [
      { key: 'serviceStyle', label: 'Service style', kind: 'text', hint: 'Buffet, seated, banana leaf, packed.' },
      { key: 'minOrder', label: 'Minimum order', kind: 'text', hint: 'e.g. 50 guests' },
      { key: 'dietary', label: 'Dietary defaults', kind: 'text', hint: 'Pure veg, Jain on request, halal.' },
      { key: 'cutoff', label: 'Guest-count cut-off', kind: 'text', hint: 'e.g. 72 hours before service.' },
    ],
    seedItems: [
      { name: 'Traditional vegetarian meal', unitClass: 'PER_GUEST', pricePaise: 45_000 },
      { name: 'Live dosa counter', unitClass: 'PER_GUEST', pricePaise: 12_000 },
      { name: 'Welcome drink', unitClass: 'PER_GUEST', pricePaise: 6_000 },
      { name: 'Serving team', unitClass: 'PER_GUEST', pricePaise: 4_500 },
    ],
  },
  {
    key: 'photography',
    label: 'Photography & video',
    itemNoun: 'coverage item',
    packageNoun: 'coverage package',
    resourceNoun: 'camera or crew kit',
    defaultUnitClass: 'FLAT',
    allowedUnitClasses: ['FLAT', 'PER_DAY', 'PER_HOUR', 'PER_UNIT'],
    defaultTaxRateBp: 1800,
    configFields: [
      { key: 'deliverables', label: 'Deliverables', kind: 'textarea', hint: 'Edited set, album, raw files, film.' },
      { key: 'coverageHours', label: 'Standard coverage', kind: 'text', hint: 'e.g. 8 hours plus travel.' },
      { key: 'turnaround', label: 'Delivery turnaround', kind: 'text', hint: 'e.g. 30 days for the edited album.' },
      { key: 'rights', label: 'Usage rights', kind: 'textarea', hint: 'What the client may publish.' },
    ],
    seedItems: [
      { name: 'Full-day wedding coverage', unitClass: 'FLAT', pricePaise: 3_500_000 },
      { name: 'Second photographer', unitClass: 'PER_DAY', pricePaise: 800_000 },
      { name: 'Cinematic highlight film', unitClass: 'FLAT', pricePaise: 2_200_000 },
      { name: 'Premium album (40 sheets)', unitClass: 'PER_UNIT', pricePaise: 450_000 },
    ],
  },
  {
    key: 'decor',
    label: 'Decor & styling',
    itemNoun: 'decor element',
    packageNoun: 'decor package',
    resourceNoun: 'prop or structure',
    defaultUnitClass: 'FLAT',
    allowedUnitClasses: ['FLAT', 'PER_UNIT', 'PER_DAY'],
    defaultTaxRateBp: 1800,
    configFields: [
      { key: 'setupWindow', label: 'Setup window', kind: 'text', hint: 'Access time needed before the event.' },
      { key: 'teardown', label: 'Teardown policy', kind: 'text' },
      { key: 'siteRequirements', label: 'Site requirements', kind: 'textarea', hint: 'Power, ceiling height, permissions.' },
      { key: 'flowers', label: 'Flower policy', kind: 'text', hint: 'Seasonal substitutions allowed?' },
    ],
    seedItems: [
      { name: 'Stage backdrop & arch', unitClass: 'FLAT', pricePaise: 4_500_000 },
      { name: 'Floral centrepieces', unitClass: 'PER_UNIT', pricePaise: 150_000 },
      { name: 'Ambient lighting design', unitClass: 'FLAT', pricePaise: 1_800_000 },
      { name: 'Entrance pathway styling', unitClass: 'FLAT', pricePaise: 1_200_000 },
    ],
  },
]

const BY_KEY = new Map(VERTICAL_CATALOG.map((v) => [v.key, v]))

/** Known vertical, or the generic specialist descriptor. Never throws. */
export function verticalDescriptor(key: string | null | undefined): VerticalDescriptor {
  if (!key) return GENERIC_VERTICAL
  return BY_KEY.get(key) ?? { ...GENERIC_VERTICAL, key, label: titleCase(key) }
}

export function isKnownVertical(key: string): boolean {
  return BY_KEY.has(key)
}

export function titleCase(key: string): string {
  return key
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
