/**
 * Rule copy for the customer, built from structured data.
 *
 * `validateSelection` returns a machine `reason` next to its English sentence, so
 * the portal can say the same thing in any language without parsing English and
 * without the domain layer knowing what a locale is.
 */

import type { SelectionRule, SelectionVerdict } from '@/lib/domain/catering'
import type { TranslateVars } from './index'

type Translate = (key: string, vars?: TranslateVars) => string

/** "2–4" / "At least 2" / "Any number" as a badge, in the reader's language. */
export function ruleLabelLocalised(t: Translate, rule: SelectionRule): string {
  if (rule.maxSelections === null) {
    return rule.minSelections > 0 ? t('rule.atLeast', { min: rule.minSelections }) : t('rule.anyNumber')
  }
  if (rule.maxSelections === rule.minSelections) {
    return t('rule.exactly', { count: rule.minSelections })
  }
  return t('rule.range', { min: rule.minSelections, max: rule.maxSelections })
}

/** The reason a session cannot be submitted yet, in the reader's language. */
export function verdictMessageLocalised(
  t: Translate,
  verdict: SelectionVerdict,
  rule: SelectionRule,
  count: number,
): string {
  if (verdict.ok) return ''
  if (verdict.reason === 'above_maximum') {
    return t('rule.aboveMax', { max: rule.maxSelections ?? 0, count })
  }
  if (verdict.reason === 'below_minimum') {
    return t('rule.belowMin', { min: rule.minSelections, count })
  }
  return t('rule.required')
}
