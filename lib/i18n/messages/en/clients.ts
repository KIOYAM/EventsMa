/**
 * Clients: the enquiries list, client directory and client detail.
 *
 * Client names, emails, phones and enquiry messages are content; everything else
 * is interface copy. Enquiry status keys are machine values stored on the row;
 * the label is translated.
 */
export const clients = {
  title: 'Enquiries',
  eyebrow: 'Relationships',
  heading: 'Every enquiry, and what happened next',
  intro:
    'A quote with no enquiry behind it is a guess. This is where a public form submission becomes a client, a follow-up and finally an event.',
  directory: 'Client directory',
  newEvent: 'New event',
  tabAll: 'All',
  searchPlaceholder: 'Search name, phone or occasion',
  emptyTitle: 'No enquiries match',
  emptyBody:
    'Clear the search or status filter. New enquiries arrive from your public page and are listed here immediately.',
  clearFilters: 'Clear filters',
  noPhone: 'No phone',
  dateNotDecided: 'Date not decided',
  noFollowUp: 'No follow-up set',
  convertToEvent: 'Convert to event',

  /** Enquiry status labels, keyed by the stored status value. */
  enquiryStatus: {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    quoted: 'Quoted',
    won: 'Won',
    lost: 'Lost',
    spam: 'Spam',
  },

  errors: {
    permission: 'clients.errors.permission',
    demo: 'clients.errors.demo',
    invalid: 'clients.errors.invalid',
    missing: 'clients.errors.missing',
    already: 'clients.errors.already',
    name: 'clients.errors.name',
    email: 'clients.errors.email',
    phone: 'clients.errors.phone',
    fallback: 'That change was not saved.',
  },

  /** Client detail page. */
  detail: {
    title: 'Client',
    back: 'All clients',
    clientSince: 'Client since',
    quoteThisClient: 'Quote this client',
    saved: 'Client details saved.',
    statEnquiries: 'Enquiries',
    statEvents: 'Events',
    statQuoted: 'Quoted',
    statOutstanding: 'Outstanding',
    cardEvents: 'Events',
    cardEnquiries: 'Enquiries',
    cardQuotations: 'Quotations',
    cardInvoices: 'Invoices',
    cardContactDetails: 'Contact details',
    noEventYet: 'No event yet.',
    noEnquiryRecorded: 'No enquiry recorded.',
    noQuotationYet: 'No quotation yet.',
    noInvoiceYet: 'No invoice yet.',
    enquiry: 'Enquiry',
    dateToConfirm: 'Date to confirm',
    noDate: 'No date',
    due: 'Due',
    noDueDate: 'No due date',
    fieldName: 'Name',
    fieldPhone: 'Phone',
    fieldEmail: 'Email',
    fieldSource: 'Source',
    fieldNotes: 'Notes',
    hintPhone: 'The last 10 digits are the dedupe key.',
    saveDetails: 'Save details',
    nothingLinkedTitle: 'Nothing linked yet',
    nothingLinkedBody: "Convert an enquiry to an event and this page becomes the client's whole history.",
    noPhone: 'No phone',
    noEmail: 'No email',
  },
} as const
