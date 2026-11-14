/**
 * The public customer link (`/share/[token]`).
 *
 * Complete in English and Tamil. This is the reference module: when you translate
 * a new surface, copy this shape — one namespace, flat keys, `{placeholders}`
 * named after what they hold, and no sentence assembled from two keys.
 */
export const share = {
  preparedBy: 'Prepared by',
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  indicativePricing: 'Indicative pricing',
  introMenu:
    'Choose the dishes you would like for each meal. Your host reviews your menu and sends a confirmed quotation — nothing is booked or charged here.',
  introServices:
    'Choose the services and items you would like for your event. Nothing is booked or charged here — the organiser reviews your choices and sends a confirmed quotation.',
  date: 'Date',
  guests: 'Guests',
  venue: 'Venue',
  toConfirm: 'To confirm',
  toBeConfirmed: 'To be confirmed',
  footerNote:
    'Prices shown are indicative catalogue rates before tax. The organiser confirms the final quotation, availability and terms.',
  privacy: 'Privacy',
  cateringMenu: 'Catering menu',
  chooseServed: 'Choose what you want served',
  pickerHelp:
    'Your host has set how many dishes you may pick in each section. Tap a dish to add it; tap again to take it off.',
  chosen: '{count} chosen',
  mealSessions: 'Meal sessions',
  timingToConfirm: 'Timing to be confirmed',
  perGuestTimes: 'Prices below are per guest × {guests} guests',
  guestsToConfirm: 'Guest count to be confirmed by your host',
  required: 'Required',
  perGuest: 'per guest',
  perItem: 'per item',
  yourPlate: 'Your plate',
  dishOne: 'dish',
  dishMany: 'dishes',
  nothingYet: 'nothing yet',
  onThePlate: 'on the plate',
  moreOnPlate: '+{count} more already on the plate',
  plateEmpty:
    'Pick a few dishes and they will be laid out here, so you can see the whole menu at a glance.',
  yourDetails: 'Your details',
  detailsHelp: 'We only ask for what the organiser needs to prepare your quotation.',
  name: 'Name',
  phone: 'Phone',
  emailLabel: 'Email',
  anythingElse: 'Anything else?',
  namePlaceholder: 'Your full name',
  phonePlaceholder: '+91 98765 43210',
  emailPlaceholder: 'you@example.com',
  messagePlaceholder: 'Timings, themes, dietary needs, people counts…',
  summary: 'Summary',
  dishesChosen: 'Dishes chosen',
  otherItems: 'Other items',
  indicative: 'Indicative',
  estimate: 'Indicative estimate',
  noDishes: 'No dishes yet',
  otherItemOne: 'other item',
  otherItemMany: 'other items',
  beforeTax: 'before tax',
  sending: 'Sending',
  sendRequest: 'Send request',
  estimateHelp:
    "This estimate uses your host's published rates for your guest count. The organiser confirms the final quotation.",
  requestReceived: 'Request received',
  receivedBody:
    'Thank you — your host has your menu and your details, and will come back with a confirmed quotation. Nothing is booked or charged from this page.',
  noMenuYet: 'The menu for this link is being prepared. Please contact the organiser directly.',
  optional: 'Optional',
  selected: '{count} selected',
  quantity: 'Quantity',
  fewer: 'Fewer {name}',
  more: 'More {name}',
  guestsCount: '{count} guests',
  errorPickDish: 'Pick at least one dish before sending your request.',
  errorChooseItem: 'Choose at least one item before submitting.',
  errorCheck: 'Please check your selections.',
  errorSubmit: 'We could not submit your request. Please try again.',
  errorNetwork: 'Network error. Please check your connection and try again.',
  errorNoMenu: 'This event has no catering menu to choose from.',
  errorSessionGone: 'One of the meal sessions is no longer available. Please refresh and choose again.',
  errorDishGone:
    'A dish you chose is no longer on the {session} menu. Please refresh and choose again.',
  changeLanguage: 'Language',
} as const
