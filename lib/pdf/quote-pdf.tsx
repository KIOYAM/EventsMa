import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { QuoteDoc } from '@/components/quote/quote-document'
import { translate } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import type { UnitClass } from '@/lib/domain/units'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { pdfFontFamily } from './fonts'

/**
 * Deterministic server-side PDF.
 *
 * Two font families: Helvetica for English (built in, no embedding), Noto Sans
 * Tamil for the Indic languages (embedded, because Helvetica has no glyphs for
 * them and would print boxes). Money is written "Rs." rather than "₹" in both
 * languages: the rupee sign is missing from Helvetica, and a document must not
 * depend on which font happened to render it.
 */

function inr(paise: number): string {
  return `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(paise / 100)}`
}

const UNIT_KEYS: Record<UnitClass, string> = {
  PER_GUEST: 'pdf.unitPerGuest',
  PER_UNIT: 'pdf.unitPerUnit',
  FLAT: 'pdf.unitFlat',
  PER_HOUR: 'pdf.unitPerHour',
  PER_DAY: 'pdf.unitPerDay',
}

const SERVICE_KEYS: Record<string, string> = {
  catering: 'pdf.serviceCatering',
  decoration: 'pdf.serviceDecoration',
  makeup: 'pdf.serviceMakeup',
  photography: 'pdf.servicePhotography',
}

function stylesFor(regular: string, bold: string) {
  return StyleSheet.create({
    page: { padding: 36, fontSize: 9, color: '#202a25', fontFamily: regular },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#183d33', paddingBottom: 12 },
    brand: { fontSize: 15, color: '#183d33', fontFamily: bold },
    muted: { color: '#68766d', fontSize: 8, marginTop: 3 },
    right: { textAlign: 'right' },
    title: { fontSize: 13, fontFamily: bold, marginTop: 14, color: '#183d33' },
    meta: { fontSize: 8, color: '#68766d', marginTop: 3 },
    group: { marginTop: 12 },
    groupHead: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e3eae4', paddingBottom: 4, marginBottom: 4 },
    groupName: { fontSize: 8, fontFamily: bold, color: '#68766d', textTransform: 'uppercase' },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    label: { flexGrow: 1, paddingRight: 8 },
    basis: { fontSize: 7, color: '#68766d', marginTop: 1 },
    amount: { width: 80, textAlign: 'right' },
    totals: { marginTop: 14, marginLeft: 'auto', width: 210 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, color: '#68766d' },
    grand: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#183d33', marginTop: 4, paddingTop: 6, fontSize: 12, fontFamily: bold, color: '#183d33' },
    terms: { marginTop: 16, padding: 8, backgroundColor: '#f6f8f6', fontSize: 7, color: '#68766d', lineHeight: 1.5 },
    footer: { marginTop: 14, fontSize: 7, color: '#68766d' },
  })
}

function QuotePdf({ doc, locale }: { doc: QuoteDoc; locale: Locale }) {
  const fonts = pdfFontFamily(locale)
  const styles = stylesFor(fonts.regular, fonts.bold)
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars)

  const serviceLabel = (serviceKey: string) => {
    const key = SERVICE_KEYS[serviceKey]
    return key ? t(key) : verticalDescriptor(serviceKey).label
  }

  return (
    <Document title={`${doc.number} · ${doc.businessName}`} author={doc.businessName} language={locale}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>{doc.businessName}</Text>
            {doc.businessPhone ? <Text style={styles.muted}>{doc.businessPhone}</Text> : null}
          </View>
          <View style={styles.right}>
            <Text style={{ fontSize: 9, fontFamily: fonts.bold }}>{t('pdf.quotation')}</Text>
            <Text style={styles.muted}>{doc.number}</Text>
            <Text style={styles.muted}>{t('pdf.validFor')}</Text>
          </View>
        </View>

        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.meta}>
          {doc.eventDate} · {t('pdf.guests', { count: doc.guests })}
          {doc.venueName ? ` · ${doc.venueName}` : ''}
        </Text>

        {doc.serviceGroups.map((group) => (
          <View key={group.serviceKey} style={styles.group} wrap={false}>
            <View style={styles.groupHead}>
              <Text style={styles.groupName}>{serviceLabel(group.serviceKey)}</Text>
              <Text style={{ fontSize: 8, color: '#68766d' }}>{inr(group.subtotalPaise)}</Text>
            </View>
            {group.lines.map((line, index) => (
              <View key={`${group.serviceKey}-${index}`} style={styles.row}>
                <View style={styles.label}>
                  <Text>{line.label}</Text>
                  <Text style={styles.basis}>
                    {t(UNIT_KEYS[line.unitClass])} · {line.basis} × {inr(line.unitRatePaise)}
                    {line.included ? ` · ${t('pdf.includedSuffix')}` : ''}
                  </Text>
                </View>
                <Text style={styles.amount}>
                  {line.included ? t('pdf.included') : inr(line.grossPaise)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{t('pdf.subtotal')}</Text>
            <Text>{inr(doc.subtotalPaise)}</Text>
          </View>
          {doc.discountPaise > 0 ? (
            <View style={styles.totalRow}>
              <Text>{t('pdf.discount')}</Text>
              <Text>- {inr(doc.discountPaise)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>{t('pdf.tax')}</Text>
            <Text>{inr(doc.taxPaise)}</Text>
          </View>
          {doc.roundOffPaise !== 0 ? (
            <View style={styles.totalRow}>
              <Text>{t('pdf.roundOff')}</Text>
              <Text>{inr(doc.roundOffPaise)}</Text>
            </View>
          ) : null}
          <View style={styles.grand}>
            <Text>{t('pdf.total')}</Text>
            <Text>{inr(doc.totalPaise)}</Text>
          </View>
        </View>

        <Text style={styles.terms}>{t('pdf.terms')}</Text>
        <Text style={styles.footer}>{t('pdf.footer')}</Text>
      </Page>
    </Document>
  )
}

/**
 * Render a quotation.
 *
 * `locale` is the *document* language, chosen by whoever generated the file — not
 * the reader's interface language. An owner working in English can still issue a
 * Tamil quotation for a Tamil customer.
 */
export async function renderQuotePdf(doc: QuoteDoc, locale: Locale = 'en'): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<QuotePdf doc={doc} locale={locale} />)
  return new Uint8Array(buffer)
}
