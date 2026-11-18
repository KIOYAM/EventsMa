/**
 * Words a visitor reads on a published storefront.
 *
 * Separated from `storefront` (the owner's studio) because the audience is
 * different and the translation backlog is counted separately. The public page
 * currently renders English by design: it is statically generated, and reading a
 * locale cookie there would de-prerender every storefront (see the localization
 * guide). Keeping the copy here means the day the page learns a locale, Tamil is
 * already written instead of needing a second extraction pass.
 */
export const storefrontPublic = {
  about: {
    title: 'About {business}',
  },
  services: {
    title: 'What this business provides',
    note: 'Prices are confirmed in a written quotation after the date, guest count and venue are known. No lead is promised here - this page exists so a customer can reach this business directly.',
    catalogueOnRequest: 'Catalogue on request',
  },
  gallery: {
    title: 'Recent work',
  },
  enquiry: {
    title: 'Ask for a quote',
    form: {
      name: 'Your name',
      mobile: 'Mobile',
      guests: 'Guests',
      date: 'Event date',
      occasion: 'Occasion',
      occasionPlaceholder: 'Wedding',
      message: 'Anything specific?',
      messagePlaceholder: 'Pure veg, banana leaf service, 350 guests.',
      submit: 'Send enquiry',
    },
  },
  serviceArea: 'Service area on request',
  packages: {
    title: 'Packages',
    onRequest: 'Rate on request',
    minimum: 'Minimum {n}',
    included: 'Included',
  },
  team: {
    title: 'The people behind the work',
  },
  faq: {
    title: 'Questions clients ask',
  },
  contact: {
    title: 'Contact',
    call: 'Call {phone}',
    based: 'Based in {city}',
    form: 'Use the form below to ask for a date.',
  },
} as const
