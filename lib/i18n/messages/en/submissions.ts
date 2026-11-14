/**
 * Submissions: customer requests that arrive through public share links.
 *
 * Customer names, emails, phones, messages and dish names are content;
 * everything else is interface copy. Submission status is a stored value;
 * the label is translated.
 */
export const submissions = {
  title: 'Submissions',
  eyebrow: 'Customer requests',
  heading: 'Submissions from your share links',
  intro:
    'Every request a customer sends through a public link lands here with their details and a service-wise breakdown. Nothing here is a lead promise — it is a request you choose to answer.',
  events: 'Events',
  stats: {
    new: 'New',
    total: 'Total',
    indicative: 'Indicative value',
  },
  emptyTitle: 'No submissions yet',
  emptyBody:
    'Open an event, go to its Services tab and create a share link. Customer requests will appear here.',
  received: 'Received {date}',
  status: '{status}',
  indicativeOnly: 'Indicative only · not a confirmed price',
  cateringMenuBySession: 'Catering menu by session',
  guestsToConfirm: 'Guests to confirm',
  dishesCount: '{count} dishes',
  services: 'Services',
  message: 'Message',
  mark: 'Mark {status}',
  prepareQuotation: 'Prepare quotation',
  noPhone: 'No phone',
  noEmail: 'No email',
  guestsCount: '{count} guests',

  errors: {
    permission: 'submissions.errors.permission',
    demo: 'submissions.errors.demo',
    invalid: 'submissions.errors.invalid',
    fallback: 'That request was not valid.',
  },

  saved: {
    reviewed: 'Reviewed.',
    quoted: 'Quoted.',
    closed: 'Closed.',
  },
} as const
