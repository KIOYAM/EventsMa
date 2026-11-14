import type { MessagesOverride } from './en'

/**
 * Tamil seed catalogue.
 *
 * SEED ONLY — these strings have not been reviewed by a Tamil speaker yet, and the
 * brief for this product requires native review before customer-facing copy ships.
 * Nothing here is wired into a screen today: it exists so Phase 3 starts from a
 * real shape and the coverage script can measure progress.
 *
 * Catering terminology (சாப்பாடு vs உணவு, session names, serving styles) is exactly
 * where a literal translation reads wrong, so it is deliberately left out until a
 * reviewer decides the words.
 */
export const ta: MessagesOverride = {
  common: {
    save: 'மாற்றங்களைச் சேமி',
    saving: 'சேமிக்கிறது…',
    cancel: 'ரத்து செய்',
    search: 'தேடு',
    back: 'பின்செல்',
    loading: 'ஏற்றுகிறது…',
    required: 'கட்டாயம்',
    optional: 'விருப்பம்',
    tryAgain: 'மீண்டும் முயற்சி செய்',
    saved: 'சேமிக்கப்பட்டது.',
    somethingWentWrong: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  },
  nav: {
    home: 'முதன்மை',
    dashboard: 'முகப்பு',
    clients: 'வாடிக்கையாளர்கள்',
    events: 'நிகழ்வுகள்',
    submissions: 'விண்ணப்பங்கள்',
    quotes: 'விலைப்புள்ளிகள்',
    invoices: 'விலைப்பட்டியல்கள்',
    catering: 'உணவு சேவை',
    decoration: 'அலங்காரம்',
    makeup: 'அழகு சேவை',
    photography: 'புகைப்படம்',
    inventory: 'சரக்கு',
    finance: 'பணம்',
    reports: 'அறிக்கைகள்',
    team: 'குழு',
    services: 'சேவைகள்',
    portfolio: 'படைப்புகள்',
    storefront: 'கடை',
    settings: 'அமைப்புகள்',
  },
  share: {
    indicativeEstimate: 'தோராயமான மதிப்பு',
    sendRequest: 'விண்ணப்பம் அனுப்பு',
    yourPlate: 'உங்கள் தட்டு',
    chooseDishes: 'என்ன பரிமாற வேண்டும் என்று தேர்ந்தெடுங்கள்',
    chosen: '{count} தேர்ந்தெடுக்கப்பட்டது',
  },
}
