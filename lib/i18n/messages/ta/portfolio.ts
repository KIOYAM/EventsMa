import type { DeepPartial } from '../en'
import { portfolio as enPortfolio } from '../en/portfolio'

/** Portfolio photography. SEED — not native-reviewed. */
export const portfolio: DeepPartial<typeof enPortfolio> = {
  photo: {
    upload: 'படம் சேர்',
    replace: 'படத்தை மாற்று',
    uploading: 'பதிவேற்றப்படுகிறது…',
    remove: 'படத்தை நீக்கு',
    hint: 'JPEG, PNG அல்லது WebP. பதிவேற்றும் முன் உங்கள் உலாவியில் சுருக்கப்படுகிறது.',
    errorType: 'இது பயன்படுத்தக்கூடிய படக்கோப்பு அல்ல.',
    errorSize: 'சுருக்கிய பிறகும் படம் பெரியதாக உள்ளது. சிறிய படத்தை முயலுங்கள்.',
    errorStorage: 'இந்தப் பணியிடத்தில் படச் சேமிப்பு அமைக்கப்படவில்லை.',
    errorPermission: 'உரிமையாளர் அல்லது மேலாளர் மட்டுமே போர்ட்ஃபோலியோ படங்களை மாற்ற முடியும்.',
    errorDemo: 'டெமோ முறை படிக்க மட்டுமே. படங்களைப் பதிவேற்ற தரவுத்தளத்தை இணைக்கவும்.',
    errorMissing: 'அந்தப் போர்ட்ஃபோலியோ பதிவு இப்போது இல்லை.',
  },
  order: {
    up: 'மேலே நகர்த்து',
    down: 'கீழே நகர்த்து',
  },
}
