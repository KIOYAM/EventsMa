/**
 * Quotations: the owner's list and detail view, the document itself, and the
 * public page a customer opens from a shared link.
 *
 * One module for both sides of the same document. The English strings here are the
 * exact sentences that were inline before, so the English output is unchanged.
 */
export const quotes = {
  title: 'Quotes',

  /*
   * List-page keys used by the first draft of this surface. Kept so a screen
   * written against them keeps working; the current list page reads `list.*`.
   */
  heading: 'Quotations',
  intro:
    'Each quotation freezes the prices used at the moment it was sent. Later catalogue edits never rewrite history.',
  filter: 'Filter',
  emptyTitle: 'No quotations yet',
  emptyBody: 'Build the first one from your catalogue. It takes about a minute.',
  emptyAction: 'Create a quote',
  line: '{number} · {date} · {guests} guests',
  all: 'All quotes',

  status: {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    expired: 'Expired',
    declined: 'Declined',
    cancelled: 'Cancelled',
  },

  list: {
    eyebrow: 'Selling',
    title: 'Quotations',
    description:
      'Each quotation freezes the prices used at the moment it was sent. Later catalogue edits never rewrite history.',
    newQuote: 'New quote',
    emptyTitle: 'No quotations yet',
    emptyBody: 'Build the first one from your catalogue. It takes about a minute.',
    meta: '{number} · {date} · {guests} guests',
    guests: '{guests} guests',
    margin: '{percent} margin',
  },

  new: {
    title: 'New quote',
    eyebrow: 'New quotation',
    heading: 'One event, every service you provide',
    description:
      'Add lines from any enabled service. The preview is instant; the saved total is recomputed on the server and frozen as version 1.',
    fromSubmissionHeading: 'Quote the customer’s selection',
    fromSubmissionIntro:
      'Prefilled with {count} lines from {client}’s submission. Check the rates, then send.',
  },

  detail: {
    all: 'All quotes',
    pdf: 'PDF',
    copyLink: 'Copy quote link',
    whatsapp: 'Share on WhatsApp',
    meta: '{guests} guests - {date}',
    customerLink: 'Customer link:',
    validUntil: 'Valid until {date}',
    acceptedBy: 'Accepted by {email}',
    acceptedTitle: 'Accepted',
    acceptedBody:
      'The customer accepted this version. Raise the invoice, then record receipts manually as the money arrives.',
    createInvoice: 'Create invoice',
    versioningTitle: 'Versioning',
    versioningBody:
      '“New revision” copies this version into the next number. The version you already sent is never edited, so a customer holding the old link still sees exactly what they received.',
    moneyTitle: 'Money',
    moneyBody:
      'Payments are recorded manually against the invoice. No gateway, card or UPI collection runs inside this app. Every receipt is append-only and visible in the ledger.',
    editPayment: 'Edit payment details',
  },

  document: {
    label: 'Quotation',
    meta: '{number} · {date} · {guests} guests',
    guests: '{guests} guests',
    item: 'Item',
    basis: 'Basis',
    amount: 'Amount',
    units: 'units',
    included: 'Included',
    includedInPackage: 'included in package',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    roundOff: 'Round-off',
    total: 'Total',
    terms:
      'Quantities and service timings are reconfirmed before the event. This quotation is valid for seven days from issue.',
    printed: 'Printed from EventsMa.',
    /** Unit classes, worded exactly as `UNIT_CLASSES` labels them. */
    unitsByClass: {
      PER_GUEST: 'Per guest',
      PER_UNIT: 'Per item / quantity',
      FLAT: 'Fixed amount',
      PER_HOUR: 'Per hour',
      PER_DAY: 'Per day / shift',
    },
  },

  /** Service names as the customer reads them, keyed by the vertical's key. */
  service: {
    catering: 'Catering & food service',
    photography: 'Photography & video',
    decor: 'Decor & styling',
    makeup: 'Makeup & hair',
    specialist: 'Specialist service',
  },

  margin: {
    title: 'Your margin · internal',
    amountLine: '{margin} on a {total} quote',
    above: 'Above your 25% floor.',
    below: 'Below your 25% target. Check the cost of the largest line before sending.',
    hidden: 'Never shown on the customer link.',
  },

  revise: {
    button: 'New revision',
    created: 'Version {version} created. Version {previous} is untouched.',
  },

  /** Builder screen: one event, lines from every enabled service. */
  composer: {
    needTitle: 'Give the quote a title, for example “Meera & Karthik — wedding lunch”.',
    needLine: 'Add at least one line from your catalogue.',
    saved: 'Quotation {number} created',
    event: 'Event',
    demo: 'Demo',
    verified: 'Server-verified',
    quoteTitle: 'Quote title',
    quoteTitlePlaceholder: 'Meera & Karthik — wedding lunch',
    eventDate: 'Event date',
    guests: 'Guests',
    client: 'Client',
    noClientLinked: 'No client linked',
    venue: 'Venue',
    venuePlaceholder: 'Sree Lakshmi Mahal',
    addFromServices: 'Add from your services',
    nothingCatalogue: 'Nothing in this service’s catalogue yet. Add an item under Catalogue first.',
    lines: 'Lines',
    noLines:
      'No lines yet. Pick an item above; each one keeps its own unit and tax rate.',
    removeLine: 'Remove {label}',
    rate: 'Rate (₹)',
    guestsField: 'Guests',
    qty: 'Qty',
    taxPercent: 'Tax %',
    amount: 'Amount',
    preview: 'Preview',
    serverRechecks: 'Server re-checks',
    subtotal: 'Subtotal',
    tax: 'Tax',
    roundOff: 'Round-off',
    total: 'Total',
    discountPercent: 'Discount %',
    discountCapped:
      'Discount was larger than the subtotal and was capped. Nothing is hidden from you.',
    marginTitle: 'Margin at the current cost',
    marginContribution: 'Contribution on a {total} quote',
    marginFloor: 'Above your 25% floor.',
    marginWarning: 'Below your 25% target. Check the cost of the largest line before sending.',
    neverShown: 'Never shown on the customer link.',
    saveAndShare: 'Save and share',
  },

  errors: {
    missing: 'The quotation could not be saved. Check the details and try again.',
    notAllowed: 'Only an owner or manager can revise a quotation.',
    demo: 'Demo mode: connect a database to create a revision.',
    unknown: 'Unknown quotation.',
    noVersion: 'This quotation has no saved version to revise.',
    readFailed: 'The current version could not be read.',
    failed: 'The revision could not be created.',
  },

  public: {
    metadataTitle: 'Your quotation',
    prepared: 'Prepared with EventsMa',
    language: 'Language',
    expired:
      'This quotation has passed its validity date. Ask the business for an updated quote.',
    acceptedOn: 'Accepted on {date}. The business has this confirmation.',
    demo: 'Demo view. This is sample data, not a live quotation.',
    success: 'Your acceptance has been recorded. The business will confirm the next step.',
    questions: 'Questions about this quote? Call {phone}.',
    questionsNoPhone: 'Questions about this quote? Call the business directly.',
    errors: {
      confirm: 'Tick the acceptance box before continuing.',
      email: 'Check the email address, or leave it blank.',
      expired: 'This quote has expired. Ask the business for an updated version.',
      closed: 'This quote is no longer open for acceptance.',
      missing: 'That quote link is no longer valid.',
      demo: 'Demo mode: acceptance is not recorded.',
    },
  },

  payment: {
    howToPay: 'How to pay',
    manual: 'Manual payment',
    upi: 'UPI ID',
    bank: 'Bank',
    accountName: 'Account name',
    accountNumber: 'Account number',
    ifsc: 'IFSC',
    noDetails: 'The business will share its bank or UPI details directly.',
    refIntro: 'Quote reference',
    refBody:
      'This page does not collect money online. Send the transfer reference to the business; they will record the receipt and issue a balance statement.',
  },

  accept: {
    eyebrow: 'Ready to proceed',
    title: 'Accept this quotation',
    body: 'This records your acceptance against the quote. It does not take a payment or lock a card.',
    emailLabel: 'Your email (optional)',
    emailHint: 'Used only to identify who accepted this version.',
    terms:
      'I accept the services, quantities and total above. I understand the business will confirm the date and collect payment separately.',
    submit: 'Accept this quotation',
    submitting: 'Recording acceptance…',
  },
} as const
