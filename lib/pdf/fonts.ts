import 'server-only'
import path from 'node:path'
import { Font } from '@react-pdf/renderer'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Fonts for the quotation PDF.
 *
 * The PDF renderer ships Helvetica, which has no Indic coverage at all: a Tamil
 * quote printed in it comes out as empty boxes. Noto Sans Tamil is committed to the
 * repo (two weights, ~150 KB) and registered once per server process.
 *
 * Registration is lazy and idempotent because `Font.register` is global state: a
 * second call with the same family replaces the first, and a cold start pays the
 * cost once.
 *
 * `next.config.ts` traces these files into the PDF route's bundle so the read works
 * on a serverless host, not just on this machine.
 */

const TAMIL_REGULAR = path.join(process.cwd(), 'app/fonts/noto-sans-tamil-regular.ttf')
const TAMIL_BOLD = path.join(process.cwd(), 'app/fonts/noto-sans-tamil-bold.ttf')

export const TAMIL_FAMILY = 'NotoSansTamil'

let registered = false

export function registerPdfFonts(): void {
  if (registered) return
  Font.register({
    family: TAMIL_FAMILY,
    fonts: [
      { src: TAMIL_REGULAR, fontWeight: 'normal' },
      { src: TAMIL_BOLD, fontWeight: 'bold' },
    ],
  })
  registered = true
}

/**
 * Which family a document in this language should use.
 *
 * English keeps Helvetica: it is a built-in, so an English quotation stays a
 * ~4 KB file with no embedded font. Every Indic language gets the embedded Noto
 * family. Mixed content (a Tamil document with an English dish name) renders in
 * Noto, which covers basic Latin too.
 */
export function pdfFontFamily(locale: Locale): { regular: string; bold: string } {
  if (locale === 'en') return { regular: 'Helvetica', bold: 'Helvetica-Bold' }
  registerPdfFonts()
  return { regular: TAMIL_FAMILY, bold: TAMIL_FAMILY }
}
