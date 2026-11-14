/**
 * Dashboard: the signed-in landing page and its attention list.
 *
 * The attention rows are built from a `code` plus numbers, so the sentence is
 * rendered in the reader's language instead of being assembled in the query
 * layer. The English detail string is kept on the item for logs.
 */
export const dashboard = {
  title: 'Dashboard',
  eyebrow: 'This week',
  heading: 'Know what you have quoted, and what it earns',
  intro:
    'Every total below is server-computed in paise from the services this business actually offers.',
  newQuote: 'New quote',

  stats: {
    pipeline: 'Open pipeline',
    pipelineHint: 'Draft and sent quotes',
    awaiting: 'Awaiting reply',
    awaitingHint: 'Sent, not yet accepted',
    upcoming: 'Upcoming events',
    upcomingHint: 'Dated today or later',
    margin: 'Average margin',
    marginHint: 'After food, crew and vendor cost',
  },

  attention: {
    heading: 'Needs attention',
    intro: 'Stale quotes, events inside two weeks and invoices past due.',
    clear: 'Nothing needs attention. Sent quotes, upcoming events and open invoices are all clear.',
    quoteStale: 'Sent at least 3 days ago - event {date}',
    eventTasksOne: '{date} - {count} open task',
    eventTasksMany: '{date} - {count} open tasks',
    invoiceOverdue: '{amount} overdue',
    invoiceOverdueSince: '{amount} overdue since {date}',
    demoEvent: '8 days away - 3 open tasks',
    demoInvoice: '{amount} balance - due 18 Nov',
    demoQuote: 'Accepted - invoice not raised yet',
  },

  services: {
    heading: 'Services you provide',
    intro: 'Each service has its own catalogue, units and tax treatment.',
    manage: 'Manage',
    empty: 'No services enabled yet. Enable catering, decor or photography to start quoting.',
    /** `{noun}` is the vertical's item noun, translated through `nouns.*`. */
    itemCount: '{count} {noun}',
  },

  /**
   * Catalogue nouns per vertical. Keyed by the descriptor's `itemNoun` so the
   * count sentence keeps the descriptor's own word instead of a generic "item".
   */
  nouns: {
    dish: 'dish',
    dishes: 'dishes',
    decorElement: 'decor element',
    decorElements: 'decor elements',
    coverageItem: 'coverage item',
    coverageItems: 'coverage items',
    makeupPackage: 'makeup package',
    makeupPackages: 'makeup packages',
    catalogueItem: 'catalogue item',
    catalogueItems: 'catalogue items',
    asset: 'asset',
    assets: 'assets',
    servicePackage: 'service package',
    servicePackages: 'service packages',
  },

  quotes: {
    heading: 'Recent quotes',
    intro: 'Grouped totals across every service on the event.',
    all: 'All quotes',
    emptyTitle: 'No quotes yet',
    emptyBody:
      'Add a service to your catalogue, then build the first quote. It takes about a minute.',
    emptyAction: 'Create a quote',
    line: '{number} · {date} ({relative}) · {guests} guests',
  },

  /** `{file}` keeps the inline code style around `.env.local`. */
  demoNote: 'Showing labelled demo data. Connect Supabase in {file} to use a live workspace.',
} as const
