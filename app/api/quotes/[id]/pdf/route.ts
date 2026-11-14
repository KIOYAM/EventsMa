import { NextResponse } from 'next/server'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getQuoteDocument } from '@/lib/db/queries'
import { SHIPPED_LOCALES, isLocale } from '@/lib/i18n/locales'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Private PDF. No cache: it carries customer and price data. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace()
  const { id } = await params

  // Document language, chosen per download: an owner working in English can still
  // hand a Tamil customer a Tamil quotation. Anything unsupported falls back to
  // English rather than to an error — a wrong language beats no document.
  const requested = new URL(request.url).searchParams.get('lang')
  const locale = isLocale(requested) && SHIPPED_LOCALES.includes(requested) ? requested : 'en'

  const doc = await withWorkspace(ctx, () => getQuoteDocument(ctx.orgId, id, ctx.demo))
  if (!doc) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Loaded lazily so the PDF renderer never reaches a client bundle.
  const { renderQuotePdf } = await import('@/lib/pdf/quote-pdf')
  const pdf = await renderQuotePdf(doc, locale)
  // Copy into a fresh ArrayBuffer so the Blob type is exact under strict typed arrays.
  const bytes = new Uint8Array(pdf.byteLength)
  bytes.set(pdf)
  const body = new Blob([bytes.buffer], { type: 'application/pdf' })

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${doc.number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
