/**
 * Operational vocabularies and read models.
 *
 * These are string unions, not database enums, for the columns where the
 * business may plausibly add a value (task state, expense category). Money and
 */
import type { UnitClass } from './units'

export const ENQUIRY_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'quoted',
  'won',
  'lost',
  'spam',
] as const
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  spam: 'Spam',
}

export const EVENT_STATUSES = [
  'enquiry',
  'tentative',
  'confirmed',
  'completed',
  'cancelled',
] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  enquiry: 'Enquiry',
  tentative: 'Tentative',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const TASK_STATUSES = ['todo', 'doing', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
}

export const INVOICE_STATUSES = ['issued', 'part_paid', 'paid', 'void'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  issued: 'Issued',
  part_paid: 'Part paid',
  paid: 'Paid',
  void: 'Void',
}

export const EXPENSE_CATEGORIES = [
  'food',
  'crew',
  'transport',
  'rental',
  'venue',
  'marketing',
  'other',
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: 'Food & supplies',
  crew: 'Crew wages',
  transport: 'Transport',
  rental: 'Rentals',
  venue: 'Venue',
  marketing: 'Marketing',
  other: 'Other',
}

export const PAYMENT_MODES = ['cash', 'upi', 'bank', 'card', 'other'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank transfer',
  card: 'Card',
  other: 'Other',
}

export interface EnquiryRow {
  id: string
  clientId?: string | null
  clientName: string
  phone: string | null
  eventDate: string | null
  guests: number
  eventType: string | null
  status: EnquiryStatus
  source: string | null
  message: string | null
  nextFollowUpAt: string | null
  createdAt: string
}

export interface EnquiryPage {
  rows: EnquiryRow[]
  total: number
  page: number
  pageSize: number
  counts: Record<string, number>
}

export interface ClientRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string | null
  enquiries: number
  events: number
  lastActivity: string
}

export interface ClientPage {
  rows: ClientRow[]
  total: number
  page: number
  pageSize: number
}

export interface ClientDetail extends Omit<ClientRow, 'enquiries' | 'events'> {
  notes: string | null
  createdAt: string
  enquiries: {
    id: string
    eventType: string | null
    eventDate: string | null
    guests: number
    status: EnquiryStatus
    createdAt: string
  }[]
  events: {
    id: string
    title: string
    eventDate: string
    status: EventStatus
    guests: number
    venueName: string | null
  }[]
  quotes: {
    id: string
    number: string
    status: string
    eventDate: string
    totalPaise: number
  }[]
  invoices: {
    id: string
    number: string
    status: InvoiceStatus
    amountPaise: number
    paidPaise: number
    dueOn: string | null
  }[]
}

export interface EventRow {
  id: string
  title: string
  clientName: string | null
  eventDate: string
  guests: number
  status: EventStatus
  venueName: string | null
  eventType: string | null
  openTasks: number
}

export interface EventPage {
  rows: EventRow[]
  total: number
  page: number
  pageSize: number
}

export interface EventTaskRow {
  id: string
  title: string
  ownerName: string | null
  dueOn: string | null
  status: TaskStatus
}

export interface EventVendorRow {
  id: string
  name: string
  category: string | null
  amountPaise: number
  status: string
  note: string | null
}

export interface EventCrewRow {
  id: string
  membershipId: string
  name: string
  roleLabel: string | null
  shiftStart: string | null
  shiftEnd: string | null
  checkedInAt: string | null
}

export interface EventQuoteRow {
  id: string
  number: string
  status: string
  totalPaise: number
}

export interface EventDetail {
  id: string
  title: string
  clientName: string | null
  clientPhone: string | null
  clientId?: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  venueName: string | null
  venueAddress: string | null
  guests: number
  status: EventStatus
  eventType: string | null
  notes: string | null
  tasks: EventTaskRow[]
  vendors: EventVendorRow[]
  crew: EventCrewRow[]
  quotes: EventQuoteRow[]
  expensesPaise: number
  paidPaise: number
  /** Services attached to this event, keyed by vertical. */
  services: {
    key: string
    label: string
    status: string
    configSnapshot: Record<string, unknown>
  }[]
}

export interface InvoiceRow {
  id: string
  number: string
  eventId: string
  eventTitle: string
  clientName: string | null
  amountPaise: number
  paidPaise: number
  status: InvoiceStatus
  dueOn: string | null
  issuedAt: string
}

export interface InvoicePage {
  rows: InvoiceRow[]
  total: number
  page: number
  pageSize: number
  outstandingPaise: number
}

export interface InvoicePaymentRow {
  id: string
  amountPaise: number
  mode: string
  reference: string | null
  receivedAt: string | null
  status: string
}

export interface InvoiceDetail extends InvoiceRow {
  quotationId: string | null
  quotationNumber: string | null
  notes: string | null
  payments: InvoicePaymentRow[]
}

export interface AcceptedQuoteOption {
  id: string
  number: string
  eventTitle: string
  amountPaise: number
  alreadyInvoiced: boolean
}

export interface FinanceRow {
  id: string
  kind: 'payment' | 'expense'
  label: string
  category: string
  amountPaise: number
  occurredOn: string
  mode: string
}

export interface FinanceData {
  rows: FinanceRow[]
  incomePaise: number
  expensePaise: number
  netPaise: number
  page: number
  pageSize: number
  total: number
}

export interface MonthPoint {
  key: string
  label: string
  revenuePaise: number
  expensePaise: number
}

export interface ReportData {
  revenuePaise: number
  expensePaise: number
  marginPaise: number
  eventCount: number
  quoteCount: number
  acceptedCount: number
  conversionBp: number
  months: MonthPoint[]
  categories: { key: string; label: string; amountPaise: number }[]
}

export interface AttentionItem {
  id: string
  kind: 'quote' | 'event' | 'invoice'
  title: string
  detail: string
  href: string
  tone: 'mint' | 'gold' | 'accent'
}

export interface CalendarEvent {
  id: string
  title: string
  eventDate: string
  status: EventStatus
  guests: number
  venueName: string | null
}

export interface PaymentDetails {
  instructions: string
  upiVpa: string
  bankName: string
  accountName: string
  accountNumber: string
  ifsc: string
}

export interface PackageRow {
  id: string
  name: string
  verticalKey: string
  unitClass: UnitClass
  ratePaise: number
  minQuantity: number
  taxRateBp: number
  inclusions: string[]
  active: boolean
}

export interface SettingsData {
  orgName: string
  plan: string
  name: string
  tagline: string | null
  city: string | null
  district: string | null
  phone: string | null
  email: string | null
  slug: string
  published: boolean
  settings: {
    taxMode: 'exclusive' | 'inclusive'
    advancePct: number
    quoteValidityDays: number
    serviceAreas: string[]
    brandPrimary: string
    brandFont: string
    payment: PaymentDetails
  }
}

export interface PortfolioRow {
  id: string
  title: string
  eventDate: string | null
  venueName: string | null
  description: string | null
  published: boolean
}

export interface StaffOption {
  id: string
  name: string
  role: string
  skills: string[]
}

/** Master list of Indian catering occasions, grouped by category. The known groups determine display order; 'Custom' is always appended. */
export const EVENT_TYPE_GROUPS = ['Wedding', 'Traditional', 'Corporate', 'Social', 'Festival']
export type EventTypeGroup = (typeof EVENT_TYPE_GROUPS)[number]

export interface EventTypeMaster {
  name: string
  groupName: EventTypeGroup
  description?: string
}

export const EVENT_TYPE_MASTERS: readonly EventTypeMaster[] = [
  // Wedding
  { name: 'Roka', groupName: 'Wedding', description: 'Families meet and fix the match; tea, snacks and a light meal.' },
  { name: 'Engagement', groupName: 'Wedding', description: 'Ring exchange, usually lunch or dinner for close family.' },
  { name: 'Mehendi', groupName: 'Wedding', description: 'Afternoon henna function; chaat, coolers, live counters.' },
  { name: 'Haldi', groupName: 'Wedding', description: 'Morning turmeric ritual; light breakfast and snacks.' },
  { name: 'Sangeet', groupName: 'Wedding', description: 'Evening music and dance; dinner with live counters.' },
  { name: 'Reception', groupName: 'Wedding', description: 'The largest guest count of the week; buffet or seated dinner.' },
  // Traditional
  { name: 'Naming ceremony', groupName: 'Traditional', description: 'Namakaranam, around the 11th day; family lunch.' },
  { name: 'First rice ceremony', groupName: 'Traditional', description: 'Annaprasanam, around the sixth month; kheer and a full meal.' },
  { name: 'Housewarming', groupName: 'Traditional', description: 'Grihapravesham with pooja; vegetarian lunch, no onion or garlic on request.' },
  // Corporate
  { name: 'Conference', groupName: 'Corporate', description: 'Full-day; morning tea, lunch, afternoon tea.' },
  { name: 'Product launch', groupName: 'Corporate', description: 'Reception format; canapes, mocktails, dessert.' },
  { name: 'Annual day', groupName: 'Corporate', description: 'Employee and family event; dinner and snacks.' },
  // Social
  { name: 'Birthday party', groupName: 'Social', description: 'Cake, snacks and dinner; children\'s menu.' },
  { name: 'Anniversary', groupName: 'Social', description: 'Family dinner, often a seated menu.' },
  // Festival
  { name: 'Diwali', groupName: 'Festival', description: 'Sweets, savouries and a festive dinner.' },
  { name: 'Onam', groupName: 'Festival', description: 'Onam sadya on a banana leaf, fixed count of dishes.' },
  // Custom fallback
  { name: 'Custom (type occasion)', groupName: 'Custom', description: 'Type any other occasion not listed above.' },
]

/** Group masters by groupName in display order, plus a Custom entry at the end. */
export function groupEventTypes(): readonly { groupName: string; rows: readonly EventTypeMaster[] }[] {
  const grouped: Record<string, EventTypeMaster[]> = {}
  for (const row of EVENT_TYPE_MASTERS) {
    ;(grouped[row.groupName] ??= []).push(row)
  }
  const knownRows: { groupName: string; rows: readonly EventTypeMaster[] }[] = []
  for (const g of EVENT_TYPE_GROUPS) {
    const rows = grouped[g]
    if (rows && rows.length) knownRows.push({ groupName: g, rows: rows as readonly EventTypeMaster[] })
  }
  const customRow = EVENT_TYPE_MASTERS[EVENT_TYPE_MASTERS.length - 1]
  if (customRow) knownRows.push({ groupName: 'Custom', rows: [customRow] })
  return knownRows
}

/** All masters as flat rows, with a custom fallback at the end. */
export function allMasters(): readonly EventTypeMaster[] {
  const last = EVENT_TYPE_MASTERS[EVENT_TYPE_MASTERS.length - 1]!
  return [...EVENT_TYPE_MASTERS.slice(0, -1), last]
}
