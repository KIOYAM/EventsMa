import type { MessagesOverride } from './en'

/**
 * Tamil catalogue — SEED ONLY, not native-reviewed.
 *
 * The share portal is the first surface translated end to end, because it is the
 * one place a customer meets the product without an account and without anyone
 * explaining it. Every string on `/share/[token]` is covered here, including the
 * rule messages, so a customer who switches to Tamil never sees a half-English
 * screen.
 *
 * Catering terminology needs a Tamil speaker's sign-off before this is described
 * as reviewed copy: உணவு / சாப்பாடு, serving styles and dish-level words are
 * exactly where a literal translation reads wrong.
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
  rule: {
    aboveMax: '{max} க்கு மேல் தேர்ந்தெடுக்க முடியாது; {count} தேர்ந்தெடுத்துள்ளீர்கள்.',
    belowMin: 'குறைந்தது {min} தேர்ந்தெடுக்க வேண்டும்; {count} தேர்ந்தெடுத்துள்ளீர்கள்.',
    required: 'இந்தப் பிரிவு கட்டாயம்.',
    checkSelection: 'தேர்வைச் சரிபார்க்கவும்.',
    anyNumber: 'எத்தனை வேண்டுமானாலும்',
    atLeast: 'குறைந்தது {min}',
    exactly: '{count} தேர்ந்தெடுக்கவும்',
    range: '{min}–{max} தேர்ந்தெடுக்கவும்',
    full: 'இந்தப் பிரிவு நிரம்பிவிட்டது — மற்றொன்றைச் சேர்ப்பதற்கு முன் ஒன்றை நீக்கவும்.',
  },
  share: {
    preparedBy: 'தயாரித்தவர்',
    call: 'அழை',
    whatsapp: 'வாட்ஸ்அப்',
    email: 'மின்னஞ்சல்',
    indicativePricing: 'தோராயமான விலை',
    introMenu:
      'ஒவ்வொரு வேளைக்கும் நீங்கள் விரும்பும் உணவுகளைத் தேர்ந்தெடுங்கள். உங்கள் நிகழ்வு நடத்துபவர் மெனுவைச் சரிபார்த்து உறுதிசெய்யப்பட்ட விலைப்புள்ளியை அனுப்புவார் — இங்கு எதுவும் முன்பதிவு ஆகாது, பணமும் செலுத்தப்படாது.',
    introServices:
      'உங்கள் நிகழ்வுக்கு வேண்டிய சேவைகளையும் பொருட்களையும் தேர்ந்தெடுங்கள். இங்கு எதுவும் முன்பதிவு ஆகாது — ஏற்பாட்டாளர் உங்கள் தேர்வைச் சரிபார்த்து விலைப்புள்ளி அனுப்புவார்.',
    date: 'தேதி',
    guests: 'விருந்தினர்கள்',
    venue: 'இடம்',
    toConfirm: 'உறுதிசெய்ய வேண்டும்',
    toBeConfirmed: 'பின்னர் உறுதிசெய்யப்படும்',
    footerNote:
      'காட்டப்படும் விலைகள் வரிக்கு முந்தைய தோராயமான பட்டியல் விலைகள். இறுதி விலைப்புள்ளி, இருப்பு மற்றும் நிபந்தனைகளை ஏற்பாட்டாளர் உறுதிசெய்வார்.',
    privacy: 'தனியுரிமை',
    cateringMenu: 'உணவு மெனு',
    chooseServed: 'என்ன பரிமாற வேண்டும் என்று தேர்ந்தெடுங்கள்',
    pickerHelp:
      'ஒவ்வொரு பிரிவிலும் எத்தனை உணவுகளைத் தேர்ந்தெடுக்கலாம் என்பதை உங்கள் நிகழ்வு நடத்துபவர் நிர்ணயித்துள்ளார். சேர்க்க ஒரு உணவைத் தட்டுங்கள்; நீக்க மீண்டும் தட்டுங்கள்.',
    chosen: '{count} தேர்ந்தெடுக்கப்பட்டது',
    mealSessions: 'உணவு வேளைகள்',
    timingToConfirm: 'நேரம் பின்னர் உறுதிசெய்யப்படும்',
    perGuestTimes: 'கீழே உள்ள விலைகள் ஒரு விருந்தினருக்கு × {guests} விருந்தினர்கள்',
    guestsToConfirm: 'விருந்தினர் எண்ணிக்கையை உங்கள் நிகழ்வு நடத்துபவர் உறுதிசெய்வார்',
    required: 'கட்டாயம்',
    perGuest: 'ஒரு விருந்தினருக்கு',
    perItem: 'ஒரு பொருளுக்கு',
    yourPlate: 'உங்கள் தட்டு',
    dishOne: 'உணவு',
    dishMany: 'உணவுகள்',
    nothingYet: 'இன்னும் எதுவும் இல்லை',
    onThePlate: 'தட்டில்',
    moreOnPlate: 'மேலும் {count} ஏற்கனவே தட்டில் உள்ளது',
    plateEmpty:
      'சில உணவுகளைத் தேர்ந்தெடுங்கள் — அவை இங்கே அடுக்கப்படும், முழு மெனுவையும் ஒரே பார்வையில் காணலாம்.',
    yourDetails: 'உங்கள் விவரங்கள்',
    detailsHelp: 'விலைப்புள்ளி தயாரிக்க ஏற்பாட்டாளருக்குத் தேவையானவற்றை மட்டுமே கேட்கிறோம்.',
    name: 'பெயர்',
    phone: 'தொலைபேசி',
    emailLabel: 'மின்னஞ்சல்',
    anythingElse: 'வேறு ஏதேனும்?',
    namePlaceholder: 'உங்கள் முழுப் பெயர்',
    phonePlaceholder: '+91 98765 43210',
    emailPlaceholder: 'you@example.com',
    messagePlaceholder: 'நேரம், கருப்பொருள், உணவுக் கட்டுப்பாடுகள், எண்ணிக்கை…',
    summary: 'சுருக்கம்',
    dishesChosen: 'தேர்ந்தெடுத்த உணவுகள்',
    otherItems: 'மற்ற பொருட்கள்',
    indicative: 'தோராயம்',
    estimate: 'தோராயமான மதிப்பு',
    noDishes: 'இன்னும் உணவுகள் இல்லை',
    otherItemOne: 'மற்ற பொருள்',
    otherItemMany: 'மற்ற பொருட்கள்',
    beforeTax: 'வரிக்கு முன்',
    sending: 'அனுப்புகிறது',
    sendRequest: 'விண்ணப்பம் அனுப்பு',
    estimateHelp:
      'இந்த மதிப்பு உங்கள் விருந்தினர் எண்ணிக்கைக்கு ஏற்ப நிகழ்வு நடத்துபவரின் விலையைப் பயன்படுத்துகிறது. இறுதி விலைப்புள்ளியை அவர் உறுதிசெய்வார்.',
    requestReceived: 'விண்ணப்பம் பெறப்பட்டது',
    receivedBody:
      'நன்றி — உங்கள் மெனுவும் விவரங்களும் ஏற்பாட்டாளரிடம் சென்றுவிட்டன. உறுதிசெய்யப்பட்ட விலைப்புள்ளியுடன் அவர் உங்களைத் தொடர்புகொள்வார். இந்தப் பக்கத்தில் எதுவும் முன்பதிவு ஆகவில்லை, பணமும் செலுத்தப்படவில்லை.',
    noMenuYet: 'இந்த இணைப்புக்கான மெனு தயாராகிறது. ஏற்பாட்டாளரை நேரடியாகத் தொடர்புகொள்ளுங்கள்.',
    optional: 'விருப்பம்',
    selected: '{count} தேர்ந்தெடுக்கப்பட்டது',
    quantity: 'எண்ணிக்கை',
    fewer: '{name} குறைவு',
    more: '{name} கூடுதல்',
    guestsCount: '{count} விருந்தினர்கள்',
    errorPickDish: 'அனுப்புவதற்கு முன் குறைந்தது ஒரு உணவைத் தேர்ந்தெடுங்கள்.',
    errorChooseItem: 'சமர்ப்பிப்பதற்கு முன் குறைந்தது ஒரு பொருளைத் தேர்ந்தெடுங்கள்.',
    errorCheck: 'உங்கள் தேர்வுகளைச் சரிபார்க்கவும்.',
    errorSubmit: 'உங்கள் விண்ணப்பத்தை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    errorNetwork: 'இணைப்புப் பிழை. இணையத்தைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    errorNoMenu: 'இந்த நிகழ்வுக்கு உணவு மெனு இல்லை.',
    errorSessionGone:
      'உணவு வேளைகளில் ஒன்று இனி இல்லை. பக்கத்தைப் புதுப்பித்து மீண்டும் தேர்ந்தெடுங்கள்.',
    errorDishGone:
      'நீங்கள் தேர்ந்தெடுத்த ஒரு உணவு {session} மெனுவில் இல்லை. புதுப்பித்து மீண்டும் தேர்ந்தெடுங்கள்.',
    changeLanguage: 'மொழி',
  },
}
