import type { DeepPartial } from '../en'
import { storefront as enStorefront } from '../en/storefront'

/**
 * Storefront customisation labels. SEED — not native-reviewed.
 *
 * Only the labels an owner reads while editing are translated; the long
 * explanations stay English until a translator reviews them, and the coverage
 * report counts that gap honestly.
 */
export const storefront: DeepPartial<typeof enStorefront> = {
  eyebrow: 'பொதுப் பக்கம்',
  title: 'உங்கள் ஸ்டோர்ஃபிரண்ட்டை மாற்றியமைக்கவும்',
  action: {
    overview: 'ஸ்டோர்ஃபிரண்ட் மேலோட்டம்',
    open: 'பொதுப் பக்கத்தைத் திற',
  },
  identity: {
    title: 'அடையாளம் மற்றும் லோகோ',
    name: 'வணிகப் பெயர்',
    tagline: 'குறிக்கோள் வாக்கியம்',
    city: 'நகரம்',
    phone: 'தொலைபேசி',
    save: 'அடையாளத்தைச் சேமி',
  },
  logo: {
    label: 'லோகோ படம்',
    upload: 'லோகோ பதிவேற்று',
    remove: 'லோகோவை நீக்கி முதலெழுத்துகளைப் பயன்படுத்து',
    heading: 'லோகோ',
  },
  brand: {
    title: 'நிறம், எழுத்துரு மற்றும் வார்த்தைகள்',
    colour: 'பிராண்ட் நிறம்',
    font: 'பெயர் எழுத்துரு',
    subtitle: 'விவர அடி வரி',
    about: 'வாடிக்கையாளருக்கான அறிமுகம்',
    save: 'பிராண்டைச் சேமி',
    layout: 'வடிவமைப்பு',
  },
  sections: {
    title: 'பிரிவுகள் மற்றும் வரிசை',
    reset: 'வடிவமைப்பை இயல்புநிலைக்குத் திரும்பு',
  },
  publish: {
    title: 'வெளியீடு',
    action: 'மாற்றங்களை வெளியிடு',
    republish: 'இந்த மாற்றங்களை வெளியிடு',
    history: 'பதிப்பு வரலாறு',
    live: 'நேரலை',
    restore: 'இந்தப் பதிப்பை மீட்டெடு',
    empty: 'இன்னும் பதிப்புகள் இல்லை.',
  },
  share: {
    title: 'வாடிக்கையாளர்களுடன் பகிர்',
    draftAction: 'வெளியீட்டுக்குச் செல்',
    address: 'உங்கள் பொது முகவரி',
    copy: 'இணைப்பை நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    whatsapp: 'வாட்ஸ்அப்பில் அனுப்பு',
    open: 'பக்கத்தைத் திற',
  },
} as const
