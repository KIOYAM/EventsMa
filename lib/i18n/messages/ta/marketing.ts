import type { DeepPartial } from '../en'
import { marketing as enMarketing } from '../en/marketing'

/**
 * Marketing in Tamil. SEED — not native-reviewed.
 *
 * English fallback is used throughout; a native reviewer should replace these
 * strings with clean Tamil.
 */
export const marketing: DeepPartial<typeof enMarketing> = {
  title: 'EventsMa | Multi-Service Event Management & Quotation Platform',
  description:
    'Manage catering, decoration, photography and event services in one workspace. Create structured quotations, manage pricing and understand your event business margins with EventsMa.',
  ogTitle: 'EventsMa | Multi-Service Event Management & Quotation Platform',
  ogDescription:
    'Every service. One event. One profitable quotation. Manage event services, catalogues, quotations and margins in one workspace.',
  ogSiteName: 'EventsMa',
  twitterTitle: 'EventsMa | Multi-Service Event Management & Quotation Platform',
  twitterDescription:
    'Every service. One event. One profitable quotation. Manage event services, catalogues, quotations and margins in one workspace.',
  structuredData: {
    name: 'EventsMa',
    description:
      'A multi-service event management and quotation workspace for catering, decoration, photography and other event businesses.',
  },
  skipLink: 'Skip to content',
  header: {
    product: 'Product',
    features: 'Features',
    solutions: 'Solutions',
    howItWorks: 'How it works',
    pricing: 'Pricing',
    faq: 'FAQ',
    signIn: 'Sign in',
    getStarted: 'Get started',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
  },
  hero: {
    eyebrow: 'Event management platform',
    titleLine1: 'Every service.',
    titleLine2: 'One event.',
    titleLine3: 'One profitable quotation.',
    body:
      'Manage catering, decoration, photography and other event services in one workspace. Build detailed quotations, calculate taxes and understand your profit before sending an offer.',
    getStarted: 'Get started',
    explore: 'Explore the product',
    noGateway: 'No payment gateway',
    noCard: 'No card data',
    serverVerified: 'Server-verified totals',
  },
  footer: {
    description:
      'One workspace for catering, decor, photography and every other event service you provide. Price it, quote it and know the margin before you send it.',
    tagline: 'Built for Coimbatore and beyond',
    product: 'Product',
    solutions: 'Solutions',
    company: 'Company',
    getStarted: 'Get started',
    signIn: 'Sign in',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    copyright: 'EventsMa. All rights reserved.',
    manualPayments: 'Manual payments only. EventsMa does not collect customer payments or store card data.',
  },
  capabilities: {
    configurableServices: {
      title: 'Configurable services',
      body: 'Catering, decor, photography and specialist services share one workspace.',
    },
    structuredCatalogues: {
      title: 'Structured catalogues',
      body: 'Each service keeps its own items, units, price, cost and tax treatment.',
    },
    serverVerifiedMoney: {
      title: 'Server-verified money',
      body: 'Integer paise, per-line tax, discount allocation and rupee round-off.',
    },
    customerReadyQuotes: {
      title: 'Customer-ready quotes',
      body: 'A public token link, PDF and WhatsApp share, with acceptance recorded.',
    },
  },
}
