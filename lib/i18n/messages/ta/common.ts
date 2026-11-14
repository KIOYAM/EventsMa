import type { DeepPartial } from '../en'
import { common as enCommon } from '../en/common'

/**
 * Shared UI words in Tamil.
 *
 * SEED — not reviewed by a Tamil speaker. `common.confirm` is deliberately absent:
 * it is the key the fallback test relies on, and it shows that a gap in a locale
 * renders English instead of an error.
 */
export const common: DeepPartial<typeof enCommon> = {
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
}
