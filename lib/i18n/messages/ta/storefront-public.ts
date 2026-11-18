import type { DeepPartial } from '../en'
import type { storefrontPublic as english } from '../en/storefront-public'

/** SEED — unreviewed. Mirrors `en/storefront-public.ts`; no page reads it yet. */
export const storefrontPublic: DeepPartial<typeof english> = {
  about: {
    title: '{business} பற்றி',
  },
  services: {
    title: 'இந்த நிறுவனம் வழங்குவது',
    note: 'தேதி, விருந்தினர் எண்ணிக்கை மற்றும் இடம் தெரிந்த பிறகு எழுத்துப்பூர்வ மேற்கோளில் விலை உறுதி செய்யப்படும். இங்கே எந்த வாடிக்கையாளரும் உறுதி செய்யப்படவில்லை - இந்தப் பக்கம் வாடிக்கையாளர் இந்த நிறுவனத்தை நேரடியாக அணுகுவதற்கே.',
    catalogueOnRequest: 'பட்டியல் கேட்டு அறியவும்',
  },
  gallery: {
    title: 'சமீபத்திய வேலைகள்',
  },
  enquiry: {
    title: 'விலை கேட்க',
    form: {
      name: 'உங்கள் பெயர்',
      mobile: 'கைபேசி',
      guests: 'விருந்தினர்கள்',
      date: 'நிகழ்வு தேதி',
      occasion: 'நிகழ்வு வகை',
      occasionPlaceholder: 'திருமணம்',
      message: 'குறிப்பாக ஏதேனும்?',
      messagePlaceholder: 'சுத்த சைவம், இலை சேவை, 350 விருந்தினர்கள்.',
      submit: 'விசாரணையை அனுப்பு',
    },
  },
  serviceArea: 'சேவைப் பகுதி கேட்டு அறியவும்',
  packages: {
    title: 'தொகுப்புகள்',
    onRequest: 'விலை கேட்டு அறியவும்',
    minimum: 'குறைந்தபட்சம் {n}',
    included: 'உள்ளடங்கியவை',
  },
  team: {
    title: 'இந்த வேலைக்குப் பின்னால் உள்ளவர்கள்',
  },
  faq: {
    title: 'வாடிக்கையாளர்கள் கேட்கும் கேள்விகள்',
  },
  contact: {
    title: 'தொடர்பு',
    call: '{phone} அழைக்கவும்',
    based: '{city} அடிப்படையில்',
    form: 'தேதி கேட்க கீழே உள்ள படிவத்தைப் பயன்படுத்தவும்.',
  },
}
