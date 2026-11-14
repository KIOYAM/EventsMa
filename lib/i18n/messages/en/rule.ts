/**
 * Selection-rule copy.
 *
 * The sentences are built from `validateSelection`'s machine `reason` plus the
 * rule numbers, never by translating the English string. Two surfaces use these
 * today: the customer link and the owner's menu planner.
 */
export const rule = {
  aboveMax: 'Choose at most {max} here; {count} selected.',
  belowMin: 'Choose at least {min} here; {count} selected.',
  required: 'This category is required.',
  checkSelection: 'Check the selection.',
  anyNumber: 'Any number',
  atLeast: 'At least {min}',
  exactly: 'Choose {count}',
  range: 'Choose {min}–{max}',
  full: 'That section is full — take one off before adding another.',
} as const
