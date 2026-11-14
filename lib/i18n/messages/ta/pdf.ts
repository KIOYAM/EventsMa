import type { DeepPartial } from '../en'
import { pdf as enPdf } from '../en/pdf'

/** Quotation PDF copy in Tamil. SEED — unreviewed; legal/financial wording needs a speaker. */
export const pdf: DeepPartial<typeof enPdf> = {
  quotation: 'விலைப்புள்ளி',
  validFor: '7 நாட்கள் செல்லுபடியாகும்',
  guests: '{count} விருந்தினர்கள்',
  subtotal: 'கூட்டுத்தொகை',
  discount: 'தள்ளுபடி',
  tax: 'வரி',
  roundOff: 'முழுமையாக்கல்',
  total: 'மொத்தம்',
  included: 'சேர்க்கப்பட்டது',
  includedSuffix: 'சேர்க்கப்பட்டது',
  terms:
    'விருந்தினர் எண்ணிக்கையும் சேவை நேரங்களும் நிகழ்வுக்கு முன் மீண்டும் உறுதிசெய்யப்படும். விருந்தினர் எண்ணிக்கை, மெனு அல்லது இடத்தின் நேரத்தில் மாற்றம் இருந்தால் இறுதித் தொகை மாறலாம். இந்த விலைப்புள்ளி வழங்கிய நாளிலிருந்து ஏழு நாட்கள் செல்லுபடியாகும்.',
  footer: 'EventsMa மூலம் தயாரிக்கப்பட்டது.',
  unitPerGuest: 'ஒரு விருந்தினருக்கு',
  unitPerUnit: 'ஒரு பொருளுக்கு',
  unitFlat: 'நிலையான தொகை',
  unitPerHour: 'மணி நேரத்திற்கு',
  unitPerDay: 'நாளுக்கு',
  serviceCatering: 'உணவு சேவை',
  serviceDecoration: 'அலங்காரம்',
  serviceMakeup: 'அழகு சேவை',
  servicePhotography: 'புகைப்படம்',
}
