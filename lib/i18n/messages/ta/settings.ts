import type { DeepPartial } from '../en'
import { settings as enSettings } from '../en/settings'

/**
 * Settings in Tamil. SEED — not native-reviewed.
 *
 * English fallback is used throughout; a native reviewer should replace these
 * strings with clean Tamil.
 */
export const settings: DeepPartial<typeof enSettings> = {
  title: 'Settings',
  eyebrow: 'Configuration',
  heading: 'The terms every quote inherits',
  intro:
    'Tax mode, advance percentage and quote validity are commercial decisions, not code. Set them once here so two quotes from the same business cannot disagree.',
  publicPageLive: 'Public page live',
  publicPageHidden: 'Public page hidden',
  saved: {
    publish: 'Public page visibility updated.',
    settings: 'Settings saved.',
  },
  demoNotice: 'Demo settings. Saving is disabled until a database is connected.',
  businessProfile: 'Business profile',
  commercialDefaults: 'Commercial defaults',
  manualPayments: 'Manual payments',
  publicPage: 'Public page',
  field: {
    businessName: 'Business name',
    tagline: 'Tagline',
    city: 'City',
    district: 'District',
    phone: 'Phone',
    email: 'Email',
    publicPageUrl: 'Public page: /p/{slug}',
  },
  taxMode: 'Tax mode',
  taxModeHint:
    'Exclusive adds GST on top of line totals. Inclusive treats the price as tax-paid.',
  taxExclusive: 'Exclusive — add tax',
  taxInclusive: 'Inclusive — tax already included',
  advancePct: 'Advance %',
  quoteValidityDays: 'Quote validity (days)',
  serviceAreas: 'Service areas',
  serviceAreasHint: 'Comma separated. Used on the public page, never in the maths.',
  brandColour: 'Brand colour',
  brandFont: 'Display font',
  fontInter: 'Inter',
  fontPlayfair: 'Playfair Display',
  fontSystem: 'System UI',
  noGateway:
    'No payment gateway is connected. These details appear on the public quotation so a customer knows where to send money; you record the receipt against the invoice.',
  upiVpa: 'UPI ID',
  upiVpaHint: 'Optional. Example: business@okicici',
  bankName: 'Bank name',
  accountName: 'Account name',
  accountNumber: 'Account number',
  ifsc: 'IFSC',
  paymentInstructions: 'Payment instructions',
  paymentInstructionsPlaceholder: 'Pay 30% advance, send the reference on WhatsApp, receipt follows.',
  saveSettings: 'Save settings',
  readOnly: {
    demo: 'Demo mode is read-only.',
    ownerOnly: 'Owner or manager only.',
  },
  published: 'Published',
  hidden: 'Hidden',
  publishingNote:
    'Publishing makes the profile and enquiry form reachable at /p/{slug}. It does not claim new customers; it exists so someone can reach you.',
  hidePublicPage: 'Hide public page',
  publishPublicPage: 'Publish public page',
  errors: {
    permission: 'settings.errors.permission',
    demo: 'settings.errors.demo',
    name: 'settings.errors.name',
    email: 'settings.errors.email',
  },
}
