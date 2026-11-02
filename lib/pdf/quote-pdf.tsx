import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { QuoteDoc } from '@/components/quote/quote-document'
import { unitClassLabel } from '@/lib/domain/units'
import { verticalDescriptor } from '@/lib/domain/verticals'

/**
 * Deterministic server-side PDF. Helvetica only, ASCII currency ("Rs.") so the
 * document renders identically on every host — the rupee sign is not in the
 * built-in font subset and must never appear as a missing glyph in a quote.
 */

function inr(paise: number): string {
  return `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(paise / 100)}`
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, color: '#202a25', fontFamily: 'Helvetica' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#183d33', paddingBottom: 12 },
  brand: { fontSize: 15, color: '#183d33', fontFamily: 'Helvetica-Bold' },
  muted: { color: '#68766d', fontSize: 8, marginTop: 3 },
  right: { textAlign: 'right' },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 14, color: '#183d33' },
  meta: { fontSize: 8, color: '#68766d', marginTop: 3 },
  group: { marginTop: 12 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e3eae4', paddingBottom: 4, marginBottom: 4 },
  groupName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#68766d', textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { flexGrow: 1, paddingRight: 8 },
  basis: { fontSize: 7, color: '#68766d', marginTop: 1 },
  amount: { width: 80, textAlign: 'right' },
  totals: { marginTop: 14, marginLeft: 'auto', width: 210 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, color: '#68766d' },
  grand: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#183d33', marginTop: 4, paddingTop: 6, fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#183d33' },
  terms: { marginTop: 16, padding: 8, backgroundColor: '#f6f8f6', fontSize: 7, color: '#68766d', lineHeight: 1.5 },
  footer: { marginTop: 14, fontSize: 7, color: '#68766d' },
})

function QuotePdf({ doc }: { doc: QuoteDoc }) {
  return (
    <Document title={`${doc.number} · ${doc.businessName}`} author={doc.businessName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>{doc.businessName}</Text>
            {doc.businessPhone ? <Text style={styles.muted}>{doc.businessPhone}</Text> : null}
          </View>
          <View style={styles.right}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>QUOTATION</Text>
            <Text style={styles.muted}>{doc.number}</Text>
            <Text style={styles.muted}>Valid 7 days</Text>
          </View>
        </View>

        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.meta}>
          {doc.eventDate} · {doc.guests} guests{doc.venueName ? ` · ${doc.venueName}` : ''}
        </Text>

        {doc.serviceGroups.map((group) => (
          <View key={group.serviceKey} style={styles.group} wrap={false}>
            <View style={styles.groupHead}>
              <Text style={styles.groupName}>{verticalDescriptor(group.serviceKey).label}</Text>
              <Text style={{ fontSize: 8, color: '#68766d' }}>{inr(group.subtotalPaise)}</Text>
            </View>
            {group.lines.map((line, index) => (
              <View key={`${group.serviceKey}-${index}`} style={styles.row}>
                <View style={styles.label}>
                  <Text>{line.label}</Text>
                  <Text style={styles.basis}>
                    {unitClassLabel(line.unitClass)} · {line.basis} × {inr(line.unitRatePaise)}
                    {line.included ? ' · included' : ''}
                  </Text>
                </View>
                <Text style={styles.amount}>{line.included ? 'Included' : inr(line.grossPaise)}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{inr(doc.subtotalPaise)}</Text>
          </View>
          {doc.discountPaise > 0 ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>- {inr(doc.discountPaise)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>Tax</Text>
            <Text>{inr(doc.taxPaise)}</Text>
          </View>
          {doc.roundOffPaise !== 0 ? (
            <View style={styles.totalRow}>
              <Text>Round-off</Text>
              <Text>{inr(doc.roundOffPaise)}</Text>
            </View>
          ) : null}
          <View style={styles.grand}>
            <Text>Total</Text>
            <Text>{inr(doc.totalPaise)}</Text>
          </View>
        </View>

        <Text style={styles.terms}>
          Guest counts and service timings are reconfirmed before the event. Changes to the guest
          count, menu or venue timing may change the final amount. This quotation is valid for seven
          days from issue.
        </Text>
        <Text style={styles.footer}>Prepared with EventsMa.</Text>
      </Page>
    </Document>
  )
}

export async function renderQuotePdf(doc: QuoteDoc): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<QuotePdf doc={doc} />)
  return new Uint8Array(buffer)
}
