import { describe, expect, it } from 'vitest'
import {
  categoryCount,
  menuTotals,
  ruleLabel,
  selectionKey,
  sessionIsValid,
  sessionPaise,
  sessionProblems,
  toggleDish,
  type MenuCategory,
  type MenuSelection,
  type MenuSession,
} from './menu-selection'

const dish = (id: string, pricePaise: number) => ({
  id,
  name: id,
  description: null,
  pricePaise,
  unitClass: 'PER_GUEST' as const,
  unitLabel: 'per guest',
  dietary: null,
  imagePath: null,
})

const starters: MenuCategory = {
  id: 'c-starters',
  name: 'Starters',
  description: null,
  rule: { minSelections: 2, maxSelections: 4, required: false },
  dishes: [dish('a', 5000), dish('b', 6000), dish('c', 7000), dish('d', 8000), dish('e', 9000)],
}

const desserts: MenuCategory = {
  id: 'c-desserts',
  name: 'Desserts',
  description: null,
  rule: { minSelections: 1, maxSelections: 3, required: false },
  dishes: [dish('gulab', 4000), dish('payasam', 4500)],
}

const optional: MenuCategory = {
  id: 'c-live',
  name: 'Live counters',
  description: null,
  rule: { minSelections: 0, maxSelections: null, required: false },
  dishes: [dish('dosa', 12000), dish('chaat', 9000), dish('pasta', 11000)],
}

const lunch: MenuSession = {
  id: 's-lunch',
  name: 'Lunch',
  startTime: '12:00',
  endTime: '14:30',
  guests: 250,
  serviceStyle: 'buffet',
  categories: [starters, desserts, optional],
}

const dinner: MenuSession = {
  ...lunch,
  id: 's-dinner',
  name: 'Dinner',
  guests: 100,
}

function pick(category: MenuCategory, ids: readonly string[], from: MenuSelection = {}): MenuSelection {
  let selection = from
  for (const id of ids) selection = toggleDish(category, selection, id).selection
  return selection
}

describe('dish selection limits', () => {
  it('refuses the fifth starter rather than dropping one', () => {
    const four = pick(starters, ['a', 'b', 'c', 'd'])
    const outcome = toggleDish(starters, four, 'e')
    expect(outcome.blocked).toBe('maximum')
    expect(outcome.selection).toBe(four)
    expect(categoryCount(starters, outcome.selection)).toBe(4)
  })

  it('toggles a chosen dish back off and frees the slot', () => {
    const four = pick(starters, ['a', 'b', 'c', 'd'])
    const removed = toggleDish(starters, four, 'b').selection
    expect(categoryCount(starters, removed)).toBe(3)
    expect(toggleDish(starters, removed, 'e').blocked).toBeNull()
  })

  it('treats a null maximum as unlimited, never as zero', () => {
    const all = pick(optional, ['dosa', 'chaat', 'pasta'])
    expect(categoryCount(optional, all)).toBe(3)
    expect(toggleDish(optional, all, 'dosa').blocked).toBeNull()
  })

  it('ignores ids that no longer belong to the category', () => {
    expect(categoryCount(starters, { [starters.id]: ['ghost', 'a'] })).toBe(1)
  })
})

describe('session rules', () => {
  it('reports a category below its minimum', () => {
    const selection = pick(starters, ['a'])
    const problems = sessionProblems(lunch, selection)
    expect(problems.map((p) => p.categoryId)).toContain('c-starters')
    expect(problems[0]?.message).toContain('at least 2')
    expect(sessionIsValid(lunch, selection)).toBe(false)
  })

  it('passes when every category is inside its range', () => {
    let selection = pick(starters, ['a', 'b'])
    selection = pick(desserts, ['gulab'], selection)
    expect(sessionIsValid(lunch, selection)).toBe(true)
  })

  it('keeps sessions independent', () => {
    const selection = pick(starters, ['a', 'b'])
    expect(categoryCount(starters, selection)).toBe(2)
    expect(sessionIsValid(dinner, {})).toBe(false)
  })

  it('describes rules the way the owner configured them', () => {
    expect(ruleLabel({ minSelections: 2, maxSelections: 4, required: false })).toBe('Choose 2–4')
    expect(ruleLabel({ minSelections: 3, maxSelections: 3, required: false })).toBe('Choose 3')
    expect(ruleLabel({ minSelections: 0, maxSelections: null, required: false })).toBe('Any number')
    expect(ruleLabel({ minSelections: 2, maxSelections: null, required: true })).toBe('At least 2')
  })
})

describe('session pricing', () => {
  it('prices each dish on the session guest count', () => {
    const selection = pick(starters, ['a', 'b'])
    // 250 guests × (₹50 + ₹60) = ₹27,500
    expect(sessionPaise(lunch, selection)).toBe(250 * (5000 + 6000))
    expect(sessionPaise(dinner, selection)).toBe(100 * (5000 + 6000))
  })

  it('totals sessions separately and together', () => {
    const starterPick = pick(starters, ['a'])
    const totals = menuTotals([lunch, dinner], {
      's-lunch': pick(desserts, ['gulab'], starterPick),
      's-dinner': pick(desserts, ['payasam'], starterPick),
    })
    expect(totals.dishCount).toBe(4)
    expect(totals.sessions[0]?.dishCount).toBe(2)
    expect(totals.sessions[1]?.guests).toBe(100)
    expect(totals.paise).toBe(250 * (5000 + 4000) + 100 * (5000 + 4500))
  })
})

describe('repeat-submission key', () => {
  it('is identical for the same menu in a different order', () => {
    const one = { 's-lunch': pick(starters, ['a', 'b']) }
    const two = { 's-lunch': pick(starters, ['b', 'a']) }
    expect(selectionKey([lunch], one)).toBe(selectionKey([lunch], two))
  })

  it('changes when a dish changes', () => {
    const one = { 's-lunch': pick(starters, ['a', 'b']) }
    const two = { 's-lunch': pick(starters, ['a', 'c']) }
    expect(selectionKey([lunch], one)).not.toBe(selectionKey([lunch], two))
  })

  it('is empty when nothing is chosen', () => {
    expect(selectionKey([lunch, dinner], {})).toBe('')
  })
})
