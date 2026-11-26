/** The org-wide audit viewer. Labels name the record, not the database column. */
export const audit = {
  eyebrow: 'Activity',
  heading: 'Audit log',
  intro:
    'Money and status changes, newest first. Read-only: nothing on this page can be edited.',
  by: 'By',
  system: 'Client or system',
  all: 'All',
  open: 'Open record',
  older: 'Older entries',
  newest: 'Newest first',
  count: '{count} entries',
  emptyTitle: 'Nothing recorded yet',
  emptyBody:
    'An invoice, a payment, an accepted quote or a joined invitation is written here as it happens.',
  filteredEmptyTitle: 'No entries for this filter',
  filteredEmptyBody: 'Try another record type, or show everything.',
  permissionTitle: 'Only owners and managers can read this',
  permissionBody:
    'The log carries prices and margins, so the database hides it from employees. Ask an owner if you need an entry.',
  entity: {
    invoice: 'Invoices',
    quotation: 'Quotes',
    invitation: 'Team',
    payment: 'Payments',
  },
  action: {
    invoiceCreated: 'Invoice created',
    invoiceMarkedPaid: 'Invoice marked paid',
    invoiceVoided: 'Invoice voided',
    paymentRecorded: 'Payment recorded',
    quoteAccepted: 'Quote accepted by client',
    invitationAccepted: 'Invitation accepted',
  },
} as const
