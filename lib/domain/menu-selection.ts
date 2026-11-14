/**
 * The customer's side of the catering engine: choosing dishes from the owner's
 * plan, under the owner's rules.
 *
 * Pure and integer-only, shared by the browser and the server, so the counter the
 * customer sees and the check the server makes cannot disagree. The server always
 * re-runs this against freshly loaded rules; a browser verdict is never trusted.
 *
 * The rule values are the same `category_selection_rules` rows the owner edits on
 * `/catering`; `validateSelection` is the same function their planning screen uses.
 */

import { validateSelection, type SelectionRule, type SelectionVerdict } from './catering'
import { priceSelection, type PricedSelection } from './share-pricing'
import type { UnitClass } from './units'

export interface MenuDish {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly pricePaise: number
  readonly unitClass: UnitClass
  readonly unitLabel: string | null
  readonly dietary: string | null
  readonly imagePath: string | null
}

export interface MenuCategory {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly rule: SelectionRule
  readonly dishes: readonly MenuDish[]
}

export interface MenuSession {
  readonly id: string
  readonly name: string
  readonly startTime: string | null
  readonly endTime: string | null
  readonly guests: number
  readonly serviceStyle: string | null
  readonly categories: readonly MenuCategory[]
}

/** categoryId → chosen dish ids. Absent means "nothing chosen yet". */
export type MenuSelection = Readonly<Record<string, readonly string[]>>

export type ToggleOutcome = {
  readonly selection: MenuSelection
  /** Set when the click was refused because the category is already full. */
  readonly blocked: 'maximum' | null
}

/** How many of this category's dishes are chosen (ignores stale ids). */
export function categoryCount(category: MenuCategory, selection: MenuSelection): number {
  const chosen = selection[category.id] ?? []
  const known = new Set(category.dishes.map((dish) => dish.id))
  return chosen.filter((id) => known.has(id)).length
}

export function canAddDish(category: MenuCategory, selection: MenuSelection): boolean {
  const rule = category.rule
  if (rule.maxSelections === null) return true
  return categoryCount(category, selection) < rule.maxSelections
}

/**
 * Toggle one dish. Selecting past the maximum is refused rather than silently
 * replacing a choice — the customer decides what to drop.
 */
export function toggleDish(
  category: MenuCategory,
  selection: MenuSelection,
  dishId: string,
): ToggleOutcome {
  const current = selection[category.id] ?? []
  if (current.includes(dishId)) {
    return {
      selection: { ...selection, [category.id]: current.filter((id) => id !== dishId) },
      blocked: null,
    }
  }
  if (!canAddDish(category, selection)) return { selection, blocked: 'maximum' }
  return { selection: { ...selection, [category.id]: [...current, dishId] }, blocked: null }
}

export interface CategoryVerdict {
  readonly categoryId: string
  readonly name: string
  readonly count: number
  readonly rule: SelectionRule
  readonly verdict: SelectionVerdict
}

export function categoryVerdicts(
  session: MenuSession,
  selection: MenuSelection,
): readonly CategoryVerdict[] {
  return session.categories.map((category) => {
    const count = categoryCount(category, selection)
    return {
      categoryId: category.id,
      name: category.name,
      count,
      rule: category.rule,
      verdict: validateSelection(category.rule, count),
    }
  })
}

/** Every reason this session cannot be submitted yet, in owner-friendly words. */
export function sessionProblems(
  session: MenuSession,
  selection: MenuSelection,
): readonly { readonly categoryId: string; readonly name: string; readonly message: string }[] {
  return categoryVerdicts(session, selection)
    .filter((row) => !row.verdict.ok)
    .map((row) => ({
      categoryId: row.categoryId,
      name: row.name,
      message: row.verdict.ok ? '' : row.verdict.message,
    }))
}

export function sessionDishCount(session: MenuSession, selection: MenuSelection): number {
  return session.categories.reduce((sum, category) => sum + categoryCount(category, selection), 0)
}

export function sessionIsValid(session: MenuSession, selection: MenuSelection): boolean {
  return sessionProblems(session, selection).length === 0
}

/** The dishes of one session, priced on that session's own guest count. */
export function sessionPricedLines(
  session: MenuSession,
  selection: MenuSelection,
): readonly PricedSelection[] {
  const lines: PricedSelection[] = []
  for (const category of session.categories) {
    const chosen = new Set(selection[category.id] ?? [])
    for (const dish of category.dishes) {
      if (!chosen.has(dish.id)) continue
      lines.push(
        priceSelection(
          {
            itemId: dish.id,
            serviceKey: 'catering',
            label: dish.name,
            unitClass: dish.unitClass,
            quantity: 1,
            unitPricePaise: dish.pricePaise,
          },
          session.guests,
        ),
      )
    }
  }
  return lines
}

export function sessionPaise(session: MenuSession, selection: MenuSelection): number {
  return sessionPricedLines(session, selection).reduce((sum, line) => sum + line.amountPaise, 0)
}

export interface MenuTotals {
  readonly dishCount: number
  readonly paise: number
  readonly sessions: readonly {
    readonly sessionId: string
    readonly name: string
    readonly guests: number
    readonly dishCount: number
    readonly paise: number
  }[]
}

export function menuTotals(
  sessions: readonly MenuSession[],
  selections: Readonly<Record<string, MenuSelection>>,
): MenuTotals {
  const rows = sessions.map((session) => {
    const selection = selections[session.id] ?? {}
    return {
      sessionId: session.id,
      name: session.name,
      guests: session.guests,
      dishCount: sessionDishCount(session, selection),
      paise: sessionPaise(session, selection),
    }
  })
  return {
    dishCount: rows.reduce((sum, row) => sum + row.dishCount, 0),
    paise: rows.reduce((sum, row) => sum + row.paise, 0),
    sessions: rows,
  }
}

/**
 * A stable string of what was chosen, for the repeat-submission guard.
 * Sorted, so two identical menus typed in a different order collide on purpose.
 */
export function selectionKey(
  sessions: readonly MenuSession[],
  selections: Readonly<Record<string, MenuSelection>>,
): string {
  const parts: string[] = []
  for (const session of sessions) {
    const selection = selections[session.id] ?? {}
    const dishIds = session.categories
      .flatMap((category) => [...(selection[category.id] ?? [])])
      .sort()
    if (dishIds.length > 0) parts.push(`${session.id}:${dishIds.join('+')}`)
  }
  return parts.sort().join('|')
}

/** "2–4", "Exactly 3", "At least 2", "Any number" — for the rule badge. */
export function ruleLabel(rule: SelectionRule): string {
  if (rule.maxSelections === null) {
    return rule.minSelections > 0 ? `At least ${rule.minSelections}` : 'Any number'
  }
  if (rule.maxSelections === rule.minSelections) return `Choose ${rule.minSelections}`
  return `Choose ${rule.minSelections}–${rule.maxSelections}`
}
