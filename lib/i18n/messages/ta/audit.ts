import type { DeepPartial } from '../en'
import { audit as enAudit } from '../en/audit'

/** Audit viewer. SEED — not native-reviewed. */
export const audit: DeepPartial<typeof enAudit> = {
  eyebrow: 'செயல்பாடு',
  heading: 'தணிக்கைப் பதிவு',
  intro: 'பணம் மற்றும் நிலை மாற்றங்கள், புதியவை முதலில். படிக்க மட்டும்: இங்கு எதையும் திருத்த முடியாது.',
  by: 'செய்தவர்',
  system: 'வாடிக்கையாளர் அல்லது அமைப்பு',
  all: 'அனைத்தும்',
  open: 'பதிவைத் திற',
  older: 'பழைய பதிவுகள்',
  newest: 'புதியவை முதலில்',
  count: '{count} பதிவுகள்',
  emptyTitle: 'இன்னும் எதுவும் பதிவாகவில்லை',
  emptyBody:
    'விலைப்பட்டியல், பணம், ஏற்கப்பட்ட மேற்கோள் அல்லது இணைந்த அழைப்பு நிகழும்போது இங்கே பதிவாகும்.',
  filteredEmptyTitle: 'இந்த வடிகட்டிக்கு பதிவுகள் இல்லை',
  filteredEmptyBody: 'வேறு பதிவு வகையைத் தேர்ந்தெடுக்கவும் அல்லது அனைத்தையும் காட்டவும்.',
  permissionTitle: 'உரிமையாளர்கள் மற்றும் மேலாளர்கள் மட்டுமே இதைப் படிக்க முடியும்',
  permissionBody:
    'இந்தப் பதிவில் விலைகள் உள்ளன, எனவே தரவுத்தளம் இதை ஊழியர்களிடமிருந்து மறைக்கிறது.',
  entity: {
    invoice: 'விலைப்பட்டியல்கள்',
    quotation: 'மேற்கோள்கள்',
    invitation: 'குழு',
    payment: 'பணம்',
  },
  action: {
    invoiceCreated: 'விலைப்பட்டியல் உருவாக்கப்பட்டது',
    invoiceMarkedPaid: 'விலைப்பட்டியல் செலுத்தப்பட்டதாகக் குறிக்கப்பட்டது',
    invoiceVoided: 'விலைப்பட்டியல் ரத்து செய்யப்பட்டது',
    paymentRecorded: 'பணம் பதிவாகியது',
    quoteAccepted: 'வாடிக்கையாளர் மேற்கோளை ஏற்றார்',
    invitationAccepted: 'அழைப்பு ஏற்கப்பட்டது',
  },
}
