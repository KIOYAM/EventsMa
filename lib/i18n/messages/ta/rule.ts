import type { DeepPartial } from '../en'
import { rule as enRule } from '../en/rule'

/** Selection-rule copy in Tamil. SEED — unreviewed. */
export const rule: DeepPartial<typeof enRule> = {
  aboveMax: '{max} க்கு மேல் தேர்ந்தெடுக்க முடியாது; {count} தேர்ந்தெடுத்துள்ளீர்கள்.',
  belowMin: 'குறைந்தது {min} தேர்ந்தெடுக்க வேண்டும்; {count} தேர்ந்தெடுத்துள்ளீர்கள்.',
  required: 'இந்தப் பிரிவு கட்டாயம்.',
  checkSelection: 'தேர்வைச் சரிபார்க்கவும்.',
  anyNumber: 'எத்தனை வேண்டுமானாலும்',
  atLeast: 'குறைந்தது {min}',
  exactly: '{count} தேர்ந்தெடுக்கவும்',
  range: '{min}–{max} தேர்ந்தெடுக்கவும்',
  full: 'இந்தப் பிரிவு நிரம்பிவிட்டது — மற்றொன்றைச் சேர்ப்பதற்கு முன் ஒன்றை நீக்கவும்.',
}
