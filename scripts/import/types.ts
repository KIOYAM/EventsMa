/**
 * Shapes for the business-data importer.
 *
 * Content files describe a tenant in ordinary words and paise; the step modules
 * turn each shape into rows in the normal tables. Nothing here is read at
 * runtime — the database is the only source the app renders from.
 */
import type { UnitClass } from '../../lib/domain/units'

export interface CatalogueItem {
  name: string
  category: string
  unit: UnitClass
  /** Tenant wording, never parsed: "per guest", "per table". */
  label: string
  /** Integer paise. */
  price: number
  cost: number
  diet?: 'veg' | 'non_veg' | 'egg'
  description?: string
  /** Meal period and group this dish belongs to. Catering only. */
  section?: string
  group?: string
}

export interface PackageSpec {
  vertical: string
  name: string
  unit: UnitClass
  rate: number
  minQuantity: number
  inclusions: string[]
}

export interface MenuSectionSpec {
  name: string
  start: string
  end: string
  groups: string[]
}

export interface RecipeSpec {
  item: string
  ingredients: {
    name: string
    quantityMilliPerServing: number
    unit: 'g' | 'ml' | 'piece'
    wastageBp: number
  }[]
}

export interface MaterialSpec {
  name: string
  category: string
  unit: string
  quantity: number
  quantityUnit: string
  costPaise: number
  supplier: string
}

export interface ArtistSpec {
  name: string
  phone: string
  email: string
  skills: string[]
  specializations: string[]
  ratePaisePerHour: number
  travelFeePaise: number
}

export interface CrewMember {
  userId: string
  name: string
  email: string
  role: 'manager' | 'employee'
  phone: string
  skills: string[]
  wage: number
}

export interface ClientSpec {
  name: string
  phone: string
  email?: string
  source: string
  notes?: string
}

export interface SupplierSpec {
  name: string
  category: string
  phone: string
  notes?: string
}

export interface InventorySpec {
  name: string
  unit: string
  reorderMilli: number
  costPaise: number
  supplier: string
  openingMilli: number
  /** Additional receipt a few days later, for a lived-in stock ledger. */
  receiptMilli?: number
}

export interface PortfolioSpec {
  title: string
  date: string
  venue: string
  description: string
}

export interface TestimonialSpec {
  name: string
  quote: string
  context: string
}

export interface FaqSpec {
  question: string
  answer: string
}

export interface TeamCard {
  name: string
  role: string
}

export interface QuoteLineSpec {
  service: string
  item?: string
  package?: string
  /** Units for PER_UNIT, hours for PER_HOUR, days for PER_DAY. */
  qty?: number
  minQty?: number
  included?: boolean
}

export interface QuoteSpec {
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'declined'
  lines: QuoteLineSpec[]
  discountAmount?: number
  validDays?: number
  sentDaysAgo?: number
  acceptedBy?: string
}

export interface PaymentSpec {
  /** Share of the invoice total, e.g. 40. */
  pct?: number
  amountPaise?: number
  mode: string
  status: 'captured' | 'pending' | 'refunded'
  receivedDaysAgo: number
  ref?: string
}

export interface InvoiceSpec {
  dueInDays: number
  issuedDaysAgo: number
  notes?: string
  payments: PaymentSpec[]
}

export interface EventCateringSpec {
  name: string
  guests: number
  style: string
  status: 'planned' | 'confirmed' | 'served' | 'cancelled'
  menu: string[]
  diet?: Record<string, number>
}

export interface EventDecorSpec {
  area: string
  type: string
  dimensions: string
  notes: string
  crew: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export interface ShotSpec {
  moment: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'must_capture'
}

export interface DeliverableSpec {
  type: string
  qty: number
  status: 'pending' | 'editing' | 'review' | 'delivered' | 'revised'
  date?: string
}

export interface EventPhotoSpec {
  coverage: string
  start: string
  end: string
  notes: string
  crew: string[]
  shots?: ShotSpec[]
  deliverables?: DeliverableSpec[]
}

export interface EventMakeupSpec {
  client: string
  style: string
  start: string
  end: string
  artist: string
  travel?: boolean
}

export interface EventTrialSpec {
  client: string
  style: string
  date: string
  approved: boolean
}

export interface EventTaskSpec {
  title: string
  due: string
  status: 'todo' | 'doing' | 'done'
}

export interface EventVendorSpec {
  name: string
  category: string
  amount: number
  status: 'booked' | 'confirmed' | 'paid' | 'cancelled'
}

export interface EventStaffSpec {
  member: string
  role: string
  start: string
  end: string
}

export interface EventExpenseSpec {
  category: string
  amount: number
  note: string
  date: string
}

export interface EventSpec {
  title: string
  client: string
  eventType: string
  date: string
  start: string
  end: string
  venue: string
  address: string
  guests: number
  status: 'enquiry' | 'tentative' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  services: string[]
  catering?: EventCateringSpec[]
  decor?: EventDecorSpec[]
  photography?: EventPhotoSpec
  makeup?: EventMakeupSpec[]
  trials?: EventTrialSpec[]
  tasks?: EventTaskSpec[]
  vendors?: EventVendorSpec[]
  staff?: EventStaffSpec[]
  quote?: QuoteSpec
  invoice?: InvoiceSpec
  expenses?: EventExpenseSpec[]
}
