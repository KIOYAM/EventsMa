import { describe, expect, it } from 'vitest'
import {
  auditEntityHref,
  auditFields,
  humaniseAction,
  humaniseKey,
  isAuditEntity,
} from './audit'

describe('humaniseAction', () => {
  it('reads a dotted action as a sentence', () => {
    expect(humaniseAction('invoice.created')).toBe('Invoice created')
  })

  it('handles underscores and a domain prefix', () => {
    expect(humaniseAction('team.invitation_accepted')).toBe('Team invitation accepted')
  })

  it('leaves an empty action empty rather than printing a stray character', () => {
    expect(humaniseAction('')).toBe('')
  })
})

describe('isAuditEntity', () => {
  it('accepts a known entity and rejects anything else', () => {
    expect(isAuditEntity('invoice')).toBe(true)
    expect(isAuditEntity('not-an-entity')).toBe(false)
    expect(isAuditEntity(null)).toBe(false)
  })
})

describe('auditEntityHref', () => {
  it('links money and quotes to their own screens', () => {
    expect(auditEntityHref('invoice', 'abc')).toBe('/invoices/abc')
    expect(auditEntityHref('quotation', 'xyz')).toBe('/quotes/xyz')
  })

  it('sends an invitation to the team screen, which is its only home', () => {
    expect(auditEntityHref('invitation', 'inv-1')).toBe('/team')
  })

  it('does not invent a link when there is no id or no screen', () => {
    expect(auditEntityHref('payment', 'pay-1')).toBeNull()
    expect(auditEntityHref('invoice', null)).toBeNull()
  })
})

describe('auditFields', () => {
  it('formats money in paise and drops empty values', () => {
    const fields = auditFields({ amountPaise: 123450, mode: 'upi', reference: null })
    expect(fields).toEqual([
      { key: 'amountPaise', label: 'Amount', value: '₹1,234.50' },
      { key: 'mode', label: 'Mode', value: 'upi' },
    ])
  })

  it('shortens a stored uuid so the list stays scannable', () => {
    const id = '12345678-1234-4000-8000-000000000000'
    expect(auditFields({ quotationId: id })[0]?.value).toBe('12345678')
  })

  it('returns nothing for an absent payload', () => {
    expect(auditFields(null)).toEqual([])
  })
})

describe('humaniseKey', () => {
  it('splits camelCase and capitalses', () => {
    expect(humaniseKey('acceptedByEmail')).toBe('Accepted by email')
  })
})
