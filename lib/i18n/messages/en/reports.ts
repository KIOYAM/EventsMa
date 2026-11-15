/**
 * Reports: revenue, costs, margin, quote conversion and category breakdown.
 *
 * All figures are money in paise, formatted for display. Category labels and
 * month labels are data; the UI copy around them is translated.
 */
export const reports = {
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

  marginTrend: 'Margin trend',
  marginTrendHint:
    'Revenue less costs for each month. A line below zero is a month that lost money.',
  marginTrendAria: 'Margin by month: {series}',
} as const
