import type { DeepPartial } from '../en'
import { dashboard as enDashboard } from '../en/dashboard'

/**
 * Dashboard in Tamil. SEED — not native-reviewed.
 *
 * "Margin" and "pipeline" are the two words most likely to be replaced by the
 * trade's own vocabulary after a native review; they are translated literally
 * here rather than guessed at.
 */
export const dashboard: DeepPartial<typeof enDashboard> = {
  title: 'முகப்பு',
  eyebrow: 'இந்த வாரம்',
  heading: 'என்ன விலை சொல்லியுள்ளீர்கள், அது என்ன ஈட்டுகிறது என்பதை அறியுங்கள்',
  intro:
    'கீழே உள்ள ஒவ்வொரு மொத்தமும், இந்த வணிகம் வழங்கும் சேவைகளின் அடிப்படையில் சேவையகத்தில் பைசாவில் கணக்கிடப்படுகிறது.',
  newQuote: 'புதிய விலைப்புள்ளி',

  stats: {
    pipeline: 'நிலுவை வாய்ப்புகள்',
    pipelineHint: 'வரைவு மற்றும் அனுப்பிய விலைப்புள்ளிகள்',
    awaiting: 'பதிலுக்காக காத்திருப்பு',
    awaitingHint: 'அனுப்பப்பட்டது, இன்னும் ஏற்கப்படவில்லை',
    upcoming: 'வரவிருக்கும் நிகழ்வுகள்',
    upcomingHint: 'இன்று அல்லது அதற்குப் பிறகு',
    margin: 'சராசரி லாப விகிதம்',
    marginHint: 'உணவு, குழு மற்றும் விற்பனையாளர் செலவுக்குப் பின்',
  },

  attention: {
    heading: 'கவனம் தேவை',
    intro: 'பழைய விலைப்புள்ளிகள், இரண்டு வாரத்திற்குள் உள்ள நிகழ்வுகள், தவணை தாண்டிய விலைப்பட்டியல்கள்.',
    clear: 'கவனம் தேவைப்படுவது எதுவுமில்லை. அனுப்பிய விலைப்புள்ளிகள், வரவிருக்கும் நிகழ்வுகள், நிலுவை விலைப்பட்டியல்கள் அனைத்தும் தெளிவாக உள்ளன.',
    quoteStale: 'குறைந்தது 3 நாட்களுக்கு முன் அனுப்பப்பட்டது - நிகழ்வு {date}',
    eventTasksOne: '{date} - {count} நிலுவை பணி',
    eventTasksMany: '{date} - {count} நிலுவை பணிகள்',
    invoiceOverdue: '{amount} தவணை தாண்டியது',
    invoiceOverdueSince: '{date} முதல் {amount} தவணை தாண்டியது',
    demoEvent: '8 நாட்கள் உள்ளன - 3 நிலுவை பணிகள்',
    demoInvoice: '{amount} நிலுவை - 18 நவ. தவணை',
    demoQuote: 'ஏற்கப்பட்டது - விலைப்பட்டியல் இன்னும் உருவாக்கப்படவில்லை',
  },

  services: {
    heading: 'நீங்கள் வழங்கும் சேவைகள்',
    intro: 'ஒவ்வொரு சேவைக்கும் தனி பட்டியல், அளவுகள் மற்றும் வரி முறை உள்ளன.',
    manage: 'நிர்வகி',
    empty: 'இன்னும் சேவைகள் இயக்கப்படவில்லை. விலை சொல்லத் தொடங்க உணவு, அலங்காரம் அல்லது புகைப்பட சேவையை இயக்குங்கள்.',
    itemCount: '{count} {noun}',
  },

  nouns: {
    dish: 'உணவு',
    dishes: 'உணவுகள்',
    decorElement: 'அலங்காரப் பொருள்',
    decorElements: 'அலங்காரப் பொருட்கள்',
    coverageItem: 'படப்பிடிப்புப் பொருள்',
    coverageItems: 'படப்பிடிப்புப் பொருட்கள்',
    makeupPackage: 'ஒப்பனைத் தொகுப்பு',
    makeupPackages: 'ஒப்பனைத் தொகுப்புகள்',
    catalogueItem: 'பட்டியல் பொருள்',
    catalogueItems: 'பட்டியல் பொருட்கள்',
    asset: 'சொத்து',
    assets: 'சொத்துகள்',
    servicePackage: 'சேவைத் தொகுப்பு',
    servicePackages: 'சேவைத் தொகுப்புகள்',
  },

  quotes: {
    heading: 'சமீபத்திய விலைப்புள்ளிகள்',
    intro: 'நிகழ்வின் அனைத்து சேவைகளின் மொத்தத் தொகைகள்.',
    all: 'அனைத்து விலைப்புள்ளிகள்',
    emptyTitle: 'இன்னும் விலைப்புள்ளிகள் இல்லை',
    emptyBody:
      'உங்கள் பட்டியலில் ஒரு சேவையைச் சேர்த்து, முதல் விலைப்புள்ளியை உருவாக்குங்கள். ஒரு நிமிடம் மட்டுமே ஆகும்.',
    emptyAction: 'விலைப்புள்ளி உருவாக்கு',
    line: '{number} · {date} ({relative}) · {guests} விருந்தினர்கள்',
  },

  demoNote:
    'லேபிளிடப்பட்ட டெமோ தரவு காட்டப்படுகிறது. நேரடி பணியிடத்தைப் பயன்படுத்த Supabase-ஐ {file} இல் இணைக்கவும்.',

  trend: {
    heading: 'வாய்ப்பு மதிப்பு போக்கு',
    hint: 'ஒவ்வொரு மாதமும் வழங்கப்பட்ட விலைப்புள்ளி மதிப்பு; நிராகரிக்கப்பட்டவை தவிர.',
    aria: 'மாதம் வாரியாக விலைப்புள்ளி மதிப்பு: {series}',
    empty: 'கடந்த ஆறு மாதங்களில் இன்னும் விலைப்புள்ளி வழங்கப்படவில்லை.',
  },
}
