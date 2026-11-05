/**
 * Demo fixtures for the operational screens.
 *
 * Labelled sample data only. Every screen that renders these shows the demo
 * badge from the shell, and every server action refuses to write.
 */

import type {
  AcceptedQuoteOption,
  ClientDetail,
  ClientRow,
  EnquiryRow,
  EventDetail,
  EventRow,
  FinanceRow,
  InvoiceDetail,
  InvoiceRow,
  PackageRow,
  PortfolioRow,
  ReportData,
  SettingsData,
  StaffOption,
} from '@/lib/domain/ops'

const ORG = '00000000-0000-4000-8000-000000000001'

export const demoEnquiries: EnquiryRow[] = [
  {
    id: '00000000-0000-4000-8000-0000000000e1',
    clientName: 'Meera & Karthik',
    phone: '+91 98420 11452',
    eventDate: '2026-11-12',
    guests: 350,
    eventType: 'Wedding lunch',
    status: 'quoted',
    source: 'Referral',
    message: 'Banana leaf service, pure veg, 350 guests. Need stage decor too.',
    nextFollowUpAt: '2026-11-05T04:30:00.000Z',
    createdAt: '2026-10-28T06:10:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000e2',
    clientName: 'Ananya & Rohan',
    phone: '+91 97877 21036',
    eventDate: '2026-11-21',
    guests: 500,
    eventType: 'Reception',
    status: 'won',
    source: 'Instagram',
    message: 'Reception with live counters and photography.',
    nextFollowUpAt: null,
    createdAt: '2026-10-24T09:25:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000e3',
    clientName: 'Pranav Tech Solutions',
    phone: '+91 90031 87640',
    eventDate: '2026-12-04',
    guests: 220,
    eventType: 'Corporate townhall',
    status: 'qualified',
    source: 'Website',
    message: 'Evening townhall, 220 pax, buffet plus two live counters.',
    nextFollowUpAt: '2026-11-06T05:00:00.000Z',
    createdAt: '2026-10-30T11:40:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000e4',
    clientName: 'Lakshmi Narayanan',
    phone: '+91 94433 09128',
    eventDate: '2026-11-08',
    guests: 80,
    eventType: 'Housewarming',
    status: 'new',
    source: 'WhatsApp',
    message: 'Small function at home. Breakfast items, 80 guests.',
    nextFollowUpAt: null,
    createdAt: '2026-11-02T03:15:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000e5',
    clientName: 'Srinivasan Family',
    phone: '+91 97877 21036',
    eventDate: '2026-10-18',
    guests: 140,
    eventType: 'Sashtiapthapoorthi',
    status: 'lost',
    source: 'Referral',
    message: 'Date clashed with another booking.',
    nextFollowUpAt: null,
    createdAt: '2026-10-02T08:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000e6',
    clientName: 'Kavya Raman',
    phone: '+91 99406 55210',
    eventDate: '2026-12-19',
    guests: 200,
    eventType: 'Birthday',
    status: 'contacted',
    source: 'Google',
    message: 'Kids birthday, evening snacks and a small stage.',
    nextFollowUpAt: '2026-11-09T10:00:00.000Z',
    createdAt: '2026-11-01T07:20:00.000Z',
  },
]

export const demoEvents: EventRow[] = [
  {
    id: '00000000-0000-4000-8000-0000000000a1',
    title: 'Meera & Karthik — Wedding lunch',
    clientName: 'Meera & Karthik',
    eventDate: '2026-11-12',
    guests: 350,
    status: 'confirmed',
    venueName: 'Sree Lakshmi Mahal, Peelamedu',
    eventType: 'Wedding lunch',
    openTasks: 3,
  },
  {
    id: '00000000-0000-4000-8000-0000000000a2',
    title: 'Ananya & Rohan — Reception',
    clientName: 'Ananya & Rohan',
    eventDate: '2026-11-21',
    guests: 500,
    status: 'confirmed',
    venueName: 'Codissia Trade Fair Complex',
    eventType: 'Reception',
    openTasks: 1,
  },
  {
    id: '00000000-0000-4000-8000-0000000000a3',
    title: 'Pranav Tech — Quarterly townhall',
    clientName: 'Pranav Tech Solutions',
    eventDate: '2026-12-04',
    guests: 220,
    status: 'tentative',
    venueName: 'Le Meridien, Avinashi Road',
    eventType: 'Corporate townhall',
    openTasks: 2,
  },
  {
    id: '00000000-0000-4000-8000-0000000000a4',
    title: 'Srinivasan — Sashtiapthapoorthi',
    clientName: 'Srinivasan Family',
    eventDate: '2026-10-18',
    guests: 140,
    status: 'completed',
    venueName: 'Family residence, R.S. Puram',
    eventType: 'Sashtiapthapoorthi',
    openTasks: 0,
  },
]

export const demoEventDetails: Record<string, EventDetail> = {
  '00000000-0000-4000-8000-0000000000a1': {
    id: '00000000-0000-4000-8000-0000000000a1',
    title: 'Meera & Karthik — Wedding lunch',
    clientName: 'Meera & Karthik',
    clientPhone: '+91 98420 11452',
    eventDate: '2026-11-12',
    startTime: '11:30',
    endTime: '15:30',
    venueName: 'Sree Lakshmi Mahal, Peelamedu',
    venueAddress: 'Avinashi Road, Peelamedu, Coimbatore 641004',
    guests: 350,
    status: 'confirmed',
    eventType: 'Wedding lunch',
    notes: 'Pure veg. Banana leaf for the elders, buffet for the rest.',
    tasks: [
      { id: 't1', title: 'Confirm final guest count', ownerName: 'Meera S.', dueOn: '2026-11-09', status: 'doing' },
      { id: 't2', title: 'Vegetable purchase — 80 kg', ownerName: 'Arun K.', dueOn: '2026-11-10', status: 'todo' },
      { id: 't3', title: 'Stage and arch setup', ownerName: 'Vendor — Flower House', dueOn: '2026-11-11', status: 'doing' },
      { id: 't4', title: 'Crew briefing and shift sheet', ownerName: 'Meera S.', dueOn: '2026-11-11', status: 'todo' },
      { id: 't5', title: 'Advance received and receipted', ownerName: 'Kannan R.', dueOn: '2026-10-30', status: 'done' },
    ],
    vendors: [
      { id: 'v1', name: 'Flower House', category: 'Florals', amountPaise: 85_000_00, status: 'booked', note: 'Stage + entrance arch' },
      { id: 'v2', name: 'Sri Balaji Sound', category: 'AV', amountPaise: 28_000_00, status: 'booked', note: 'Two mics, one speaker set' },
      { id: 'v3', name: 'Green Leaf Rentals', category: 'Rentals', amountPaise: 22_000_00, status: 'quote', note: '50 chairs, 6 tables' },
    ],
    crew: [
      { id: 'cs1', membershipId: '00000000-0000-4000-8000-0000000000b1', name: 'Arun K.', roleLabel: 'Counter lead', shiftStart: '08:00', shiftEnd: '16:00', checkedInAt: null },
      { id: 'cs2', membershipId: '00000000-0000-4000-8000-0000000000b2', name: 'Meera S.', roleLabel: 'Floor manager', shiftStart: '09:00', shiftEnd: '17:00', checkedInAt: null },
    ],
    quotes: [
      { id: '00000000-0000-4000-8000-0000000000c1', number: 'QT-2026-0041', status: 'sent', totalPaise: 16_432_800 },
    ],
    expensesPaise: 2_45_000_00,
    paidPaise: 4_92_984_00,
  },
  '00000000-0000-4000-8000-0000000000a2': {
    id: '00000000-0000-4000-8000-0000000000a2',
    title: 'Ananya & Rohan — Reception',
    clientName: 'Ananya & Rohan',
    clientPhone: '+91 97877 21036',
    eventDate: '2026-11-21',
    startTime: '18:00',
    endTime: '23:00',
    venueName: 'Codissia Trade Fair Complex',
    venueAddress: 'Gandhipuram, Coimbatore 641014',
    guests: 500,
    status: 'confirmed',
    eventType: 'Reception',
    notes: 'Three live counters. Photography until the last guest leaves.',
    tasks: [
      { id: 't6', title: 'Lock the counter menu', ownerName: 'Meera S.', dueOn: '2026-11-15', status: 'doing' },
      { id: 't7', title: 'Confirm second photographer', ownerName: 'Kannan R.', dueOn: '2026-11-16', status: 'done' },
    ],
    vendors: [
      { id: 'v4', name: 'Pixel Story', category: 'Photography', amountPaise: 1_20_000_00, status: 'booked', note: 'Two shooters + drone' },
    ],
    crew: [
      { id: 'cs3', membershipId: '00000000-0000-4000-8000-0000000000b1', name: 'Arun K.', roleLabel: 'Counter lead', shiftStart: '15:00', shiftEnd: '23:30', checkedInAt: null },
    ],
    quotes: [
      { id: '00000000-0000-4000-8000-0000000000c2', number: 'QT-2026-0040', status: 'accepted', totalPaise: 24_880_000 },
    ],
    expensesPaise: 3_80_000_00,
    paidPaise: 7_464_000_00,
  },
}

export const demoInvoices: InvoiceRow[] = [
  {
    id: '00000000-0000-4000-8000-0000000000d1',
    number: 'INV-2026-0018',
    eventId: '00000000-0000-4000-8000-0000000000a2',
    eventTitle: 'Ananya & Rohan — Reception',
    clientName: 'Ananya & Rohan',
    amountPaise: 24_880_000,
    paidPaise: 7_464_000,
    status: 'part_paid',
    dueOn: '2026-11-18',
    issuedAt: '2026-10-26T05:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-0000000000d2',
    number: 'INV-2026-0017',
    eventId: '00000000-0000-4000-8000-0000000000a4',
    eventTitle: 'Srinivasan — Sashtiapthapoorthi',
    clientName: 'Srinivasan Family',
    amountPaise: 4_80_000_00,
    paidPaise: 4_80_000_00,
    status: 'paid',
    dueOn: '2026-10-18',
    issuedAt: '2026-10-04T05:30:00.000Z',
  },
]

export const demoInvoiceDetails: Record<string, InvoiceDetail> = {
  '00000000-0000-4000-8000-0000000000d1': {
    ...demoInvoices[0]!,
    quotationId: '00000000-0000-4000-8000-0000000000c2',
    quotationNumber: 'QT-2026-0040',
    notes: 'Advance 30% received on 26 October. Balance due before setup.',
    payments: [
      { id: 'p1', amountPaise: 7_464_000, mode: 'bank', reference: 'NEFT 884201', receivedAt: '2026-10-26T06:15:00.000Z', status: 'captured' },
    ],
  },
  '00000000-0000-4000-8000-0000000000d2': {
    ...demoInvoices[1]!,
    quotationId: null,
    quotationNumber: null,
    notes: null,
    payments: [
      { id: 'p2', amountPaise: 1_44_000_00, mode: 'upi', reference: null, receivedAt: '2026-10-05T09:00:00.000Z', status: 'captured' },
      { id: 'p3', amountPaise: 3_36_000_00, mode: 'cash', reference: null, receivedAt: '2026-10-18T13:30:00.000Z', status: 'captured' },
    ],
  },
}

export const demoClients: ClientRow[] = [
  {
    id: 'demo-client-meera',
    name: 'Meera & Karthik',
    phone: '+91 98420 11001',
    email: 'meera.karthik@example.com',
    source: 'public_page',
    enquiries: 2,
    events: 1,
    lastActivity: '2026-10-28T09:00:00.000Z',
  },
  {
    id: 'demo-client-ananya',
    name: 'Ananya & Rohan',
    phone: '+91 98420 11002',
    email: 'ananya.rohan@example.com',
    source: 'whatsapp',
    enquiries: 1,
    events: 1,
    lastActivity: '2026-10-24T11:30:00.000Z',
  },
  {
    id: 'demo-client-pranav',
    name: 'Pranav Tech',
    phone: '+91 98420 11003',
    email: 'events@pranav.example',
    source: 'manual',
    enquiries: 1,
    events: 1,
    lastActivity: '2026-10-12T06:15:00.000Z',
  },
]

export const demoAcceptedQuotes: AcceptedQuoteOption[] = [
  {
    id: '00000000-0000-4000-8000-0000000000c2',
    number: 'QT-2026-0040',
    eventTitle: 'Ananya & Rohan — Reception',
    amountPaise: 24_880_000,
    alreadyInvoiced: true,
  },
  {
    id: '00000000-0000-4000-8000-0000000000c3',
    number: 'QT-2026-0038',
    eventTitle: 'Kavya Raman — Birthday',
    amountPaise: 3_20_000_00,
    alreadyInvoiced: false,
  },
]

export const demoFinanceRows: FinanceRow[] = [
  { id: 'f1', kind: 'payment', label: 'Ananya & Rohan — advance', category: 'Bank transfer', amountPaise: 7_464_000, occurredOn: '2026-10-26', mode: 'bank' },
  { id: 'f2', kind: 'expense', label: 'Flower House — stage florals', category: 'rental', amountPaise: 85_000_00, occurredOn: '2026-10-27', mode: 'upi' },
  { id: 'f3', kind: 'expense', label: 'Vegetable purchase — 80 kg', category: 'food', amountPaise: 42_000_00, occurredOn: '2026-10-29', mode: 'cash' },
  { id: 'f4', kind: 'payment', label: 'Srinivasan — balance', category: 'Cash', amountPaise: 3_36_000_00, occurredOn: '2026-10-18', mode: 'cash' },
  { id: 'f5', kind: 'expense', label: 'Crew wages — October', category: 'crew', amountPaise: 1_18_000_00, occurredOn: '2026-10-31', mode: 'bank' },
  { id: 'f6', kind: 'expense', label: 'Diesel and transport', category: 'transport', amountPaise: 18_400_00, occurredOn: '2026-11-01', mode: 'cash' },
]

export const demoReport: ReportData = {
  revenuePaise: 15_60_000_00,
  expensePaise: 5_80_000_00,
  marginPaise: 9_80_000_00,
  eventCount: 4,
  quoteCount: 12,
  acceptedCount: 5,
  conversionBp: 4167,
  months: [
    { key: '2026-06', label: 'Jun', revenuePaise: 2_10_000_00, expensePaise: 1_10_000_00 },
    { key: '2026-07', label: 'Jul', revenuePaise: 2_60_000_00, expensePaise: 1_25_000_00 },
    { key: '2026-08', label: 'Aug', revenuePaise: 1_95_000_00, expensePaise: 1_05_000_00 },
    { key: '2026-09', label: 'Sep', revenuePaise: 2_85_000_00, expensePaise: 1_45_000_00 },
    { key: '2026-10', label: 'Oct', revenuePaise: 3_60_000_00, expensePaise: 1_65_000_00 },
    { key: '2026-11', label: 'Nov', revenuePaise: 2_50_000_00, expensePaise: 1_30_000_00 },
  ],
  categories: [
    { key: 'food', label: 'Food & supplies', amountPaise: 2_40_000_00 },
    { key: 'crew', label: 'Crew wages', amountPaise: 1_60_000_00 },
    { key: 'rental', label: 'Rentals', amountPaise: 95_000_00 },
    { key: 'transport', label: 'Transport', amountPaise: 45_000_00 },
    { key: 'marketing', label: 'Marketing', amountPaise: 40_000_00 },
  ],
}

export const demoPackages: PackageRow[] = [
  {
    id: '00000000-0000-4000-8000-0000000000f1',
    name: 'Veg banquet — 7 items',
    verticalKey: 'catering',
    unitClass: 'PER_GUEST',
    ratePaise: 85_000,
    minQuantity: 100,
    taxRateBp: 500,
    inclusions: ['Welcome drink', 'Two starters', 'Three mains', 'Payasam', 'Banana leaf service'],
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-0000000000f2',
    name: 'Stage and entrance decor',
    verticalKey: 'decor',
    unitClass: 'FLAT',
    ratePaise: 4_50_000,
    minQuantity: 1,
    taxRateBp: 1800,
    inclusions: ['Backdrop', 'Entrance arch', 'Aisle florals'],
    active: true,
  },
  {
    id: '00000000-0000-4000-8000-0000000000f3',
    name: 'Full-day coverage',
    verticalKey: 'photography',
    unitClass: 'PER_DAY',
    ratePaise: 3_50_000,
    minQuantity: 1,
    taxRateBp: 1800,
    inclusions: ['Lead photographer', 'Second shooter', 'Edited album'],
    active: true,
  },
]

export const demoSettings: SettingsData = {
  orgName: 'Annapoorna Signature Events',
  plan: 'trial',
  name: 'Annapoorna Signature Events',
  tagline: 'Catering, decor and photography for one day you will keep.',
  city: 'Coimbatore',
  district: 'Coimbatore',
  phone: '+91 98420 11452',
  email: 'hello@annapoorna.example',
  slug: 'annapoorna-signature-events',
  published: true,
  settings: {
    taxMode: 'exclusive',
    advancePct: 30,
    quoteValidityDays: 7,
    serviceAreas: ['Coimbatore', 'Tiruppur', 'Erode', 'Pollachi'],
    brandPrimary: '#1f4d3a',
    brandFont: 'Playfair Display',
    payment: {
      instructions:
        'Pay the advance by UPI or bank transfer, then send the reference to the business on WhatsApp. A receipt is issued from the workspace after the money is received.',
      upiVpa: 'annapoorna@okicici',
      bankName: 'Indian Bank',
      accountName: 'Annapoorna Signature Events',
      accountNumber: '1234567890',
      ifsc: 'IDIB000C001',
    },
  },
}

export const demoPortfolio: PortfolioRow[] = [
  {
    id: '00000000-0000-4000-8000-0000000000a9',
    title: 'Meera & Karthik — 350-guest wedding lunch',
    eventDate: '2025-11-14',
    venueName: 'Sree Lakshmi Mahal, Peelamedu',
    description: 'Banana leaf service, four live counters, stage florals in marigold.',
    published: true,
  },
  {
    id: '00000000-0000-4000-8000-0000000000b9',
    title: 'Pranav Tech — annual townhall',
    eventDate: '2025-08-22',
    venueName: 'Le Meridien, Avinashi Road',
    description: 'Buffet for 220, two counters, AV and stage lighting.',
    published: true,
  },
  {
    id: '00000000-0000-4000-8000-0000000000c9',
    title: 'Srinivasan — sashtiapthapoorthi',
    eventDate: '2025-06-09',
    venueName: 'Family residence, R.S. Puram',
    description: 'Breakfast function for 140 with a traditional menu.',
    published: false,
  },
]

export const demoStaff: StaffOption[] = [
  { id: '00000000-0000-4000-8000-0000000000b1', name: 'Arun K.', role: 'employee', skills: ['dosa counter', 'inventory'] },
  { id: '00000000-0000-4000-8000-0000000000b2', name: 'Meera S.', role: 'manager', skills: ['floor manager', 'client calls'] },
  { id: '00000000-0000-4000-8000-0000000000b3', name: 'Kannan R.', role: 'owner', skills: ['quotes', 'vendor deals'] },
]

export const demoOrgId = ORG
