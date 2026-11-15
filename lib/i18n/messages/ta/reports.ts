import type { DeepPartial } from '../en'
import { reports as enReports } from '../en/reports'

/**
 * Reports in Tamil. SEED — not native-reviewed.
 *
 * English fallback is used throughout; a native reviewer should replace these
 * strings with clean Tamil.
 */
export const reports: DeepPartial<typeof enReports> = {
  title: 'Reports',
  eyebrow: 'Performance',
  heading: 'The numbers you would show a bank',
  intro:
    'Server-aggregated from captured payments and recorded expenses. No client-side totals, no chart library, no measurement timing to go wrong.',
  ledgerCsv: 'Ledger CSV',
  monthlyCsv: 'Monthly CSV',
  stats: {
    revenue: 'Revenue',
    revenueHint: 'All captured payments',
    costs: 'Costs',
    costsHint: 'All recorded expenses',
    margin: 'Margin',
    marginHint: '{percent} of revenue',
    conversion: 'Quote conversion',
    conversionHint: '{accepted} of {quotes} accepted',
  },
  lastSixMonths: 'Last six months',
  revenue: 'Revenue',
  costs: 'Costs',
  barsNote:
    'Bars are percentages of the highest month in the window. Exact figures are in the monthly CSV.',
  whereMoneyWent: 'Where the money went',
  noExpenses: 'No expenses recorded yet.',
  share: '{amount} · {percent}%',
  eventsAndQuotes: 'Events and quotes',
  eventsOnRecord: 'Events on record',
  quotesIssued: 'Quotes issued',
  accepted: 'Accepted',
  conversionLabel: 'Conversion',
  conversionNote:
    'Conversion counts accepted quotes over every quote issued in the workspace, not just this month. A quote that was revised counts once.',
  errors: {
    permission: 'reports.errors.permission',
    demo: 'reports.errors.demo',
  },

  marginTrend: 'லாப வரம்பு போக்கு',
  marginTrendHint:
    'ஒவ்வொரு மாதமும் வருவாய் கழித்து செலவு. பூஜ்ஜியத்திற்குக் கீழே இருந்தால் அந்த மாதம் நட்டம்.',
  marginTrendAria: 'மாதம் வாரியாக லாப வரம்பு: {series}',
}
