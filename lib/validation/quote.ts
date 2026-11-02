import { z } from 'zod'
import { UNIT_CLASSES } from '@/lib/domain/units'

const unitClassValues = UNIT_CLASSES.map((u) => u.key) as [string, ...string[]]

export const quoteLineSchema = z.object({
  id: z.string().min(1).max(64),
  serviceKey: z.string().min(1).max(64),
  label: z.string().min(1).max(160),
  unitClass: z.enum(unitClassValues),
  unitLabel: z.string().max(40).optional(),
  unitRatePaise: z.number().int().min(0).max(10_000_000_000),
  quantity: z.number().min(0).max(100_000),
  minQuantity: z.number().min(0).max(100_000).optional(),
  includedInPackage: z.boolean().optional(),
  taxRateBp: z.number().int().min(0).max(5000),
  costPerUnitPaise: z.number().int().min(0).max(10_000_000_000).optional(),
})

export const saveQuoteSchema = z.object({
  quotationId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  title: z.string().min(1).max(160),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientId: z.string().uuid().optional(),
  venueName: z.string().max(160).optional(),
  guests: z.number().int().min(0).max(100_000),
  lines: z.array(quoteLineSchema).min(1).max(120),
  discountKind: z.enum(['amount', 'percent']).default('percent'),
  discountValue: z.number().min(0).max(100_000_000),
  discountReason: z.string().max(200).optional(),
  /** The total the client displayed. A mismatch beyond ₹1 is logged; the server wins. */
  clientTotalPaise: z.number().int().min(0).optional(),
})

export type SaveQuoteInput = z.infer<typeof saveQuoteSchema>
