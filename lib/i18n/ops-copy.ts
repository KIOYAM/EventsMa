/**
 * Copy keys for the operational vocabularies in `lib/domain/ops`.
 *
 * The values in `ops.ts` are stored identifiers (statuses, occasion names) and
 * must never change. These helpers turn an identifier into the catalogue key
 * that renders it, so no screen has to build a key by string surgery and a
 * missing label shows up in the coverage report instead of at runtime.
 */

import type { EventStatus, TaskStatus } from '@/lib/domain/ops'
import type { TranslateVars } from './index'

type Translate = (key: string, vars?: TranslateVars) => string

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

/**
 * The owner-side rule summary ("2–4", "At least 2", "Exactly 3", "Any number").
 *
 * The wording matches what `describeRule` printed before translation, so the
 * English screen is unchanged; only the words and the number order move.
 */
export function selectionSummaryLabel(
  t: Translate,
  rule: { minSelections: number; maxSelections: number | null },
): string {
  if (rule.maxSelections === null) {
    return rule.minSelections > 0
      ? t('catering.rules.summaryAtLeast', { min: rule.minSelections })
      : t('catering.rules.summaryAny')
  }
  if (rule.maxSelections === rule.minSelections) {
    return t('catering.rules.summaryExactly', { count: rule.minSelections })
  }
  return t('catering.rules.summaryRange', { min: rule.minSelections, max: rule.maxSelections })
}

const PRICING_KEYS: Record<string, string> = {
  per_guest: 'catering.pricingMode.perGuest',
  per_unit: 'catering.pricingMode.perUnit',
  flat: 'catering.pricingMode.flat',
}

/**
 * Stored pricing mode → display label.
 *
 * A mode the catalogue has never seen keeps the old readable form
 * (`sundries_mode` → `sundries mode`) rather than pretending to be something it
 * is not. The stored value is never rewritten.
 */
export function pricingModeLabel(t: Translate, mode: string): string {
  const key = PRICING_KEYS[mode]
  return key ? t(key) : mode.replace(/_/g, ' ')
}

/**
 * Stored unit class → lower-case display label, the form the screens printed
 * before translation (`PER_UNIT` → `per unit`). The enum key is unchanged.
 */
export function unitClassLabelLocalised(t: Translate, unitClass: string): string {
  return t(`catering.unitClass.${unitClass}`)
}

/** Ingredient unit key (`g`, `ml`, `piece`) → its display word. */
export function ingredientUnitLabel(t: Translate, unit: string): string {
  return t(`catering.unit.${unit}`)
}
