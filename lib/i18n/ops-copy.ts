/**
 * Copy keys for the operational vocabularies in `lib/domain/ops`.
 *
 * The values in `ops.ts` are stored identifiers (statuses, occasion names) and
 * must never change. These helpers turn an identifier into the catalogue key
 * that renders it, so no screen has to build a key by string surgery and a
 * missing label shows up in the coverage report instead of at runtime.
 */

import type { EventStatus, TaskStatus } from '@/lib/domain/ops'

/** `confirmed` → `events.status.confirmed`. */
export function eventStatusKey(status: EventStatus | string): string {
  return `events.status.${status}`
}

/** `doing` → `events.taskStatus.doing`. */
export function taskStatusKey(status: TaskStatus | string): string {
  return `events.taskStatus.${status}`
}

/**
 * Occasion master name → description key.
 *
 * Names are proper nouns and ritual names stored in the database, so they stay
 * as written; only the description under the option is interface copy.
 */
const OCCASION_KEYS: Record<string, string> = {
  Roka: 'events.occasion.roka',
  Engagement: 'events.occasion.engagement',
  Mehendi: 'events.occasion.mehendi',
  Haldi: 'events.occasion.haldi',
  Sangeet: 'events.occasion.sangeet',
  Reception: 'events.occasion.reception',
  'Naming ceremony': 'events.occasion.naming',
  'First rice ceremony': 'events.occasion.firstRice',
  Housewarming: 'events.occasion.housewarming',
  Conference: 'events.occasion.conference',
  'Product launch': 'events.occasion.launch',
  'Annual day': 'events.occasion.annualDay',
  'Birthday party': 'events.occasion.birthday',
  Anniversary: 'events.occasion.anniversary',
  Diwali: 'events.occasion.diwali',
  Onam: 'events.occasion.onam',
  'Custom (type occasion)': 'events.occasion.custom',
}

export function occasionKey(name: string): string | undefined {
  return OCCASION_KEYS[name]
}

/** `Wedding` → `events.occasionGroup.wedding`. Unknown groups fall back to `custom`. */
export function occasionGroupKey(groupName: string): string {
  const slug = groupName.toLowerCase().replace(/[^a-z]+/g, '')
  const known = ['wedding', 'traditional', 'corporate', 'social', 'festival']
  return known.includes(slug) ? `events.occasionGroup.${slug}` : 'events.occasionGroup.custom'
}
