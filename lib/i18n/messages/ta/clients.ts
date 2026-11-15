import type { DeepPartial } from '../en'
import { clients as enClients } from '../en/clients'

/**
 * Clients in Tamil. SEED — not native-reviewed.
 */
export const clients: DeepPartial<typeof enClients> = {
  title: 'விசாரணைகள்',
  eyebrow: 'உறவுகள்',
  heading: 'ஒவ்வொரு விசாரணையும், அதன் பிறகு என்ன நடந்தது',
  intro:
    'விலைப்புள்ளிக்கு பின்னர் விசாரணை இல்லை என்றால் அது ஊகம்தான்.',
  directory: 'வாடிக்கையாளர் பட்டியல்',
  newEvent: 'புதிய நிகழ்வு',
  tabAll: 'அனைத்தும்',
  searchPlaceholder: 'பெயர், தொலைபேசி அல்லது சந்தர்ப்பத்தைத் தேடுங்கள்',
  emptyTitle: 'பொருந்தும் விசாரணைகள் இல்லை',
  emptyBody:
    'தேடு அல்லது நிலை வடிகட்டியைச் சுத்தம் செய்யுங்கள்.',
  clearFilters: 'வடிகட்டுகளைச் சுத்தம் செய்',
  noPhone: 'தொலைபேசி இல்லை',
  dateNotDecided: 'தேதி தீர்மானிக்கப்படவில்லை',
  noFollowUp: 'பின்தொடர் அமைக்கப்படவில்லை',
  convertToEvent: 'நிகழ்வாக மாற்று',

  enquiryStatus: {
    new: 'புதியது',
    contacted: 'தொடர்பு கொண்டார்',
    qualified: 'தகுதியுள்ளார்',
    quoted: 'விலை சொல்லப்பட்டது',
    won: 'வெற்றி',
    lost: 'இழந்தது',
    spam: 'ஸ்பேம்',
  },

  errors: {
    permission: 'clients.errors.permission',
    demo: 'clients.errors.demo',
    invalid: 'clients.errors.invalid',
    missing: 'clients.errors.missing',
    already: 'clients.errors.already',
    name: 'clients.errors.name',
    email: 'clients.errors.email',
    phone: 'clients.errors.phone',
    fallback: 'அந்த மாற்றம் சேமிக்கப்படவில்லை.',
  },

  detail: {
    title: 'வாடிக்கையாளர்',
    back: 'அனைத்து வாடிக்கையாளர்கள்',
    clientSince: 'வாடிக்கையாளர்',
    quoteThisClient: 'இந்த வாடிக்கையாளருக்கு விலைப்புள்ளி',
    saved: 'வாடிக்கையாளர் விவரங்கள் சேமிக்கப்பட்டது.',
    statEnquiries: 'விசாரணைகள்',
    statEvents: 'நிகழ்வுகள்',
    statQuoted: 'விலை சொல்லப்பட்டது',
    statOutstanding: 'நிலுவை',
    cardEvents: 'நிகழ்வுகள்',
    cardEnquiries: 'விசாரணைகள்',
    cardQuotations: 'விலைப்புள்ளிகள்',
    cardInvoices: 'விலைப்பட்டியல்கள்',
    cardContactDetails: 'தொடர்பு விவரங்கள்',
    noEventYet: 'இன்னும் நிகழ்வு இல்லை.',
    noEnquiryRecorded: 'விசாரணை பதிவு செய்யப்படவில்லை.',
    noQuotationYet: 'இன்னும் விலைப்புள்ளி இல்லை.',
    noInvoiceYet: 'இன்னும் விலைப்பட்டியல் இல்லை.',
    enquiry: 'விசாரணை',
    dateToConfirm: 'தேதி உறுதி செய்ய வேண்டும்',
    noDate: 'தேதி இல்லை',
    due: 'தவணை',
    noDueDate: 'தவணை தேதி இல்லை',
    fieldName: 'பெயர்',
    fieldPhone: 'தொலைபேசி',
    fieldEmail: 'மின்னஞ்சல்',
    fieldSource: 'மூலம்',
    fieldNotes: 'குறிப்புகள்',
    hintPhone: 'இறுதி 10 எண்கள்',
    saveDetails: 'விவரங்களைச் சேமி',
    nothingLinkedTitle: 'ஏதும் இல்லை',
    nothingLinkedBody: 'விசாரணையை நிகழ்வாக மாற்றுங்கள்.',
    noPhone: 'தொலைபேசி இல்லை',
    noEmail: 'மின்னஞ்சல் இல்லை',
  },

  save: 'சேமி',
  statusLabel: 'விசாரணை நிலை',
  guests: 'விருந்தினர்',
  followUp: 'பின்தொடரவும்',
  demoNotice: 'மாதிரி தரவு. தரவுத்தளம் இணைக்கும் வரை விசாரணை மாற்றங்கள் முடக்கப்பட்டுள்ளன.',

  table: {
    enquiry: 'விசாரணை',
    contact: 'தொடர்பு',
    received: 'பெறப்பட்டது',
    actions: 'செயல்கள்',
  },
}
