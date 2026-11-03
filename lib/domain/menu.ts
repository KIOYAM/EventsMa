/**
 * Menu shapes shared by the database query, the demo board and the UI.
 *
 * A menu is three levels deep: meal period → group → dish. The dish itself is a
 * `service_items` row, so it can be quoted; the meal period and group are pure
 * presentation and never touch pricing.
 */

export const DIETARY = {
  veg: { label: 'Veg', tone: 'success' as const },
  egg: { label: 'Egg', tone: 'gold' as const },
  non_veg: { label: 'Non-veg', tone: 'accent' as const },
} as const

export type DietaryKey = keyof typeof DIETARY

export type UnitKey = 'PER_GUEST' | 'PER_UNIT' | 'FLAT' | 'PER_HOUR' | 'PER_DAY'

export const MEAL_SUGGESTIONS = [
  'Breakfast',
  'Lunch',
  'High tea',
  'Dinner',
  'Live counters',
] as const

export type MenuItemView = {
  id: string
  name: string
  description: string | null
  pricePaise: number
  unitClass: UnitKey
  dietary: DietaryKey | null
  imagePath: string | null
  imageBytes: number
}

export type MenuGroupView = {
  id: string
  name: string
  description: string | null
  items: MenuItemView[]
}

export type MenuSectionView = {
  id: string
  name: string
  windowStart: string | null
  windowEnd: string | null
  groups: MenuGroupView[]
}

export type MenuBoard = {
  sections: MenuSectionView[]
  /** Bytes used by this org's menu images, summed from stored rows. */
  imageBytes: number
}

/** '07:00' + '10:30' → '7:00 – 10:30 am'; a single value renders alone. */
export function windowLabel(start: string | null, end: string | null): string {
  const one = (value: string) => {
    const [hRaw, mRaw] = value.split(':')
    const h = Number(hRaw)
    const mins = Number(mRaw ?? 0)
    if (!Number.isFinite(h)) return value
    const suffix = h < 12 ? 'am' : 'pm'
    const hour = h % 12 === 0 ? 12 : h % 12
    return `${hour}:${String(Number.isFinite(mins) ? mins : 0).padStart(2, '0')} ${suffix}`
  }
  if (start && end) return `${one(start)} – ${one(end)}`
  if (start) return `from ${one(start)}`
  if (end) return `until ${one(end)}`
  return 'Any time'
}

export function itemCount(section: MenuSectionView): number {
  return section.groups.reduce((total, group) => total + group.items.length, 0)
}
