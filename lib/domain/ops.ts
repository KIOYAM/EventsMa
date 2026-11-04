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
