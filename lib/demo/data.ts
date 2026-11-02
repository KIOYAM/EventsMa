/**
 * Labelled demo workspace.
 *
 * This exists so the app runs and can be reviewed before a Supabase project is
 * connected. It is NOT production data: `isDemo` is true and every screen shows
 * a badge. Production always has DATABASE_URL, so this path is unreachable there.
 */

import type { QuoteComputation } from '@/lib/domain/pricing'
import { computeQuote } from '@/lib/domain/pricing'

export const DEMO_ORG_ID = '00000000-0000-4000-8000-000000000001'

export const demoBusiness = {
  id: 'demo-business',
  orgId: DEMO_ORG_ID,
  name: 'Annapoorna Signature Events',
  tagline: 'Catering, decor and photography for one day you will keep.',
  city: 'Coimbatore',
  district: 'Coimbatore',
  phone: '+91 98420 11452',
  email: 'hello@annapoorna.example',
  published: true,
  settings: { taxMode: 'exclusive' as const, advancePct: 30, quoteValidityDays: 7 },
}

export interface DemoService {
  id: string
  verticalKey: string
  enabled: boolean
  sortOrder: number
  config: Record<string, string>
}

export const demoServices: DemoService[] = [
  { id: 's1', verticalKey: 'catering', enabled: true, sortOrder: 0, config: { serviceStyle: 'Banana leaf + buffet', minOrder: '50 guests' } },
  { id: 's2', verticalKey: 'decor', enabled: true, sortOrder: 1, config: { setupWindow: '6 hours before' } },
  { id: 's3', verticalKey: 'photography', enabled: true, sortOrder: 2, config: { coverageHours: '8 hours + travel' } },
]

export const demoItems = [
  { id: 'i1', verticalKey: 'catering', name: 'Traditional vegetarian meal', unitClass: 'PER_GUEST' as const, pricePaise: 45_000, costPaise: 30_000, taxRateBp: 500, active: true, category: 'Main' },
  { id: 'i2', verticalKey: 'catering', name: 'Live dosa counter', unitClass: 'PER_GUEST' as const, pricePaise: 12_000, costPaise: 5_000, taxRateBp: 500, active: true, category: 'Counter' },
  { id: 'i3', verticalKey: 'catering', name: 'Welcome drink', unitClass: 'PER_GUEST' as const, pricePaise: 6_000, costPaise: 2_200, taxRateBp: 500, active: true, category: 'Beverage' },
  { id: 'i4', verticalKey: 'decor', name: 'Stage backdrop & arch', unitClass: 'FLAT' as const, pricePaise: 450_000, costPaise: 260_000, taxRateBp: 1800, active: true, category: 'Stage' },
  { id: 'i5', verticalKey: 'decor', name: 'Floral centrepieces', unitClass: 'PER_UNIT' as const, pricePaise: 15_000, costPaise: 8_000, taxRateBp: 1800, active: true, category: 'Floral' },
  { id: 'i6', verticalKey: 'photography', name: 'Full-day wedding coverage', unitClass: 'FLAT' as const, pricePaise: 350_000, costPaise: 180_000, taxRateBp: 1800, active: true, category: 'Coverage' },
  { id: 'i7', verticalKey: 'photography', name: 'Second photographer', unitClass: 'PER_DAY' as const, pricePaise: 80_000, costPaise: 45_000, taxRateBp: 1800, active: true, category: 'Crew' },
]

export const demoClients = [
  { id: 'c1', name: 'Meera & Karthik', phone: '+91 98420 11452', source: 'Referral' },
  { id: 'c2', name: 'Srinivasan Family', phone: '+91 97877 21036', source: 'WhatsApp' },
  { id: 'c3', name: 'Pranav Tech Solutions', phone: '+91 90031 87640', source: 'Website' },
]

export const demoQuotes = [
  {
    id: 'q1',
    number: 'QT-2026-0041',
    title: 'Meera & Karthik — Wedding lunch',
    clientName: 'Meera & Karthik',
    eventDate: '2026-11-12',
    guests: 350,
    status: 'sent' as const,
    totalPaise: 16_432_800,
    marginBp: 3100,
    services: ['catering', 'decor'],
  },
  {
    id: 'q2',
    number: 'QT-2026-0040',
    title: 'Ananya & Rohan — Reception',
    clientName: 'Ananya & Rohan',
    eventDate: '2026-11-21',
    guests: 500,
    status: 'accepted' as const,
    totalPaise: 24_880_000,
    marginBp: 2740,
    services: ['catering', 'decor', 'photography'],
  },
  {
    id: 'q3',
    number: 'QT-2026-0039',
    title: 'Pranav Tech — Quarterly townhall',
    clientName: 'Pranav Tech Solutions',
    eventDate: '2026-11-07',
    guests: 220,
    status: 'draft' as const,
    totalPaise: 6_490_000,
    marginBp: 2250,
    services: ['catering'],
  },
]

/** A worked multi-service example, computed by the real engine. */
export function demoComputation(): QuoteComputation {
  return computeQuote({
    guests: 350,
    lines: [
      { id: 'l1', serviceKey: 'catering', label: 'Traditional vegetarian meal', unitClass: 'PER_GUEST', unitRatePaise: 45_000, quantity: 0, minQuantity: 100, taxRateBp: 500, costPerUnitPaise: 30_000 },
      { id: 'l2', serviceKey: 'catering', label: 'Live dosa counter', unitClass: 'PER_GUEST', unitRatePaise: 12_000, quantity: 0, taxRateBp: 500, costPerUnitPaise: 5_000 },
      { id: 'l3', serviceKey: 'decor', label: 'Stage backdrop & arch', unitClass: 'FLAT', unitRatePaise: 450_000, quantity: 1, taxRateBp: 1800, costPerUnitPaise: 260_000 },
      { id: 'l4', serviceKey: 'photography', label: 'Full-day wedding coverage', unitClass: 'FLAT', unitRatePaise: 350_000, quantity: 1, taxRateBp: 1800, costPerUnitPaise: 180_000 },
    ],
    orderDiscount: { kind: 'percent', value: 2, reason: 'Repeat client' },
  })
}
