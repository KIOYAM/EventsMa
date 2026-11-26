/**
 * Words a visitor reads on a published storefront.
 *
 * Separated from `storefront` (the owner's studio) because the audience is
 * different and the translation backlog is counted separately. The public page
 * currently renders English by design: it is statically generated, and reading a
 * locale cookie there would de-prerender every storefront (see the localization
 * guide). Keeping the copy here means the day the page learns a locale, Tamil is
 * already written instead of needing a second extraction pass.
 *
 * `overline` strings are the small uppercase label above each section heading.
 */
export const storefrontPublic = {
  /** The owner-only draft preview that wraps this page. */
  preview: {
    label: 'Preview',
    note: 'You are editing this draft. Visitors still see the published version until you publish.',
    sharedLabel: 'Client preview',
    sharedNote:
      'A draft shared for review. It is not published or indexed, enquiries are paused, and this link expires.',
    back: 'Back to editor',
    published: 'Published page',
    formOff:
      'The enquiry form is disabled in preview. Enquiries sent by clients still arrive in your workspace.',
  },
  hero: {
    call: 'Call {phone}',
    quote: 'Ask for a quote',
    services: 'See what we do',
    lede: 'Menus, packages and a written quote for your date.',
  },
  facts: {
    based: 'Based in',
    services: 'Services',
    quote: 'Quote',
    quoteValue: 'In writing',
    call: 'Call',
  },
  about: {
    overline: 'Our story',
    title: 'About {business}',
  },
  services: {
    overline: 'Made for your occasion',
    title: 'What this business provides',
    lede: 'What you can book, and a taste of what is on the catalogue.',
    empty: 'The full menu goes out with the quote.',
    ask: 'Ask about this',
    askMenu: 'Ask for the menu',
    note: 'Prices are confirmed in a written quotation after the date, guest count and venue are known. No lead is promised here - this page exists so a customer can reach this business directly.',
    catalogueOnRequest: 'Catalogue on request',
  },
  dishes: {
    overline: 'From the catalogue',
    title: 'On the menu',
    lede: 'Items the kitchen keeps on the list. Ask for any of them to be included in a package.',
    ask: 'Ask about this item',
  },
  gallery: {
    overline: 'Moments we are proud of',
    title: 'Recent work',
    lede: 'Photographs the owner has published. Every one is a real event.',
  },
  testimonials: {
    overline: 'In their words',
    title: 'What clients say',
    lede: 'Quotes from families and teams this business has worked with.',
  },
  enquiry: {
    kicker: 'Enquiry',
    title: 'Ask for a quote',
    lede: 'Tell us the date, the guest count and the venue. The owner replies with a written quote.',
    step1: 'Your enquiry reaches the owner immediately.',
    step2: 'You get a written quote once the date, guest count and venue are known.',
    step3: 'Nothing is charged and no booking is created on this page.',
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
  closing: {
    overline: "Let's make your gathering memorable",
    title: "Tell us what you're celebrating.",
    body: 'Share your date, guest count and the kind of food you love. The details can be shaped from there.',
  },
  serviceArea: 'Service area on request',
  packages: {
    overline: 'From the kitchen',
    title: 'Packages',
    lede: 'A package is a starting point. Menus are adjusted to the guest count, traditions and service style.',
    onRequest: 'Rate on request',
    minimum: 'Minimum {n}',
    included: 'Included',
    ask: 'Ask about this package',
  },
  team: {
    overline: 'Who you will meet',
    title: 'The people behind the work',
  },  faq: {
    overline: 'Before you ask',
    title: 'Questions clients ask',
  },
  contact: {
    overline: 'Contact',
    title: 'Contact',
    call: 'Call {phone}',
    based: 'Based in {city}',
    replies: 'Replies usually within a day.',
    form: 'Use the form below to ask for a date.',
  },
  footer: {
    poweredBy: 'Powered by EventsMa',
  },
  channels: {
    whatsapp: 'WhatsApp',
    email: 'Email',
  },
} as const
