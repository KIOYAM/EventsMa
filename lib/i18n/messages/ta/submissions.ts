import type { DeepPartial } from '../en'
import { submissions as enSubmissions } from '../en/submissions'

/**
 * Submissions in Tamil. SEED — not native-reviewed.
 */
export const submissions: DeepPartial<typeof enSubmissions> = {
  title: 'விண்ணப்பங்கள்',
  eyebrow: 'வாடிக்கையாளர் கோரிக்கைகள்',
  heading: 'உங்கள் பகிர்வு இணைப்புகளில் இருந்து விண்ணப்பங்கள்',
  intro: 'வாடிக்கையாளர் கோரிக்கைகள் இங்கு வரும்.',
  events: 'நிகழ்வுகள்',
  stats: {
    new: 'புதியது',
    total: 'மொத்தம்',
    indicative: 'தோராயமான மதிப்பு',
  },
  emptyTitle: 'இன்னும் விண்ணப்பங்கள் இல்லை',
  emptyBody: 'ஒரு நிகழ்வைத் திறக்கவும்.',
  received: '{date}',
  viewQuote: 'விலைப்புள்ளியைத் திற',
  status: '{status}',
  indicativeOnly: 'தோராயமானதுதான் · உறுதிக்கப்பட்ட விலை அல்ல',
  cateringMenuBySession: 'வேளை வாரிய உணவு பட்டியல்',
  guestsToConfirm: 'விருந்தினர்களை உறுதி செய்ய வேண்டும்',
  dishesCount: '{count} உணவுகள்',
  services: 'சேவைகள்',
  message: 'செய்தி',
  mark: 'நிலை {status}',
  prepareQuotation: 'விலைப்புள்ளி',
  noPhone: 'தொலைபேசி இல்லை',
  noEmail: 'மின்னஞ்சல் இல்லை',
  guestsCount: '{count} விருந்தினர்கள்',

  errors: {
    permission: 'submissions.errors.permission',
    demo: 'submissions.errors.demo',
    invalid: 'submissions.errors.invalid',
    fallback: 'அந்த கோரிக்கை செல்லாதது.',
  },

  saved: {
    reviewed: 'சரிபார்க்கப்பட்டது.',
    quoted: 'விலை சொல்லப்பட்டது.',
    closed: 'மூடப்பட்டது.',
  },
}
