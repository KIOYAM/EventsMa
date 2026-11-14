/**
 * The English catalogue: the source of truth.
 *
 * Every other locale is a partial of this shape, so a missing translation is a
 * type-level gap that falls back to English at runtime rather than a crash.
 *
 * Keys are stable identifiers. They are never built from user input and never
 * contain business data — a dish name is content, not a key.
 */
export const en = {
  common: {
    save: 'Save changes',
    saving: 'Saving…',
    cancel: 'Cancel',
    search: 'Search',
    back: 'Back',
    loading: 'Loading…',
    required: 'Required',
    optional: 'Optional',
    tryAgain: 'Try again',
    saved: 'Saved.',
    confirm: 'Confirm',
    somethingWentWrong: 'Something went wrong. Please try again.',
  },
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    clients: 'Clients',
    events: 'Events',
    submissions: 'Submissions',
    quotes: 'Quotes',
    invoices: 'Invoices',
    catering: 'Catering',
    decoration: 'Decoration',
    makeup: 'Makeup',
    photography: 'Photography',
    inventory: 'Inventory',
    finance: 'Money',
    reports: 'Reports',
    team: 'Team',
    services: 'Services',
    portfolio: 'Portfolio',
    storefront: 'Storefront',
    settings: 'Settings',
  },
  share: {
    indicativeEstimate: 'Indicative estimate',
    sendRequest: 'Send request',
    yourPlate: 'Your plate',
    chooseDishes: 'Choose what you want served',
    chosen: '{count} chosen',
  },
} as const

/** Deep partial of the English catalogue: the shape every locale must fit. */
export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends string ? string : DeepPartial<T[Key]>
}

export type Messages = typeof en
export type MessagesOverride = DeepPartial<Messages>
