import { describe, expect, it } from 'vitest'
import { EMPTY_PAYMENT_DETAILS, paymentDetailsFrom } from './payments'

describe('paymentDetailsFrom', () => {
  it('returns blank instructions for older settings JSON', () => {
    expect(paymentDetailsFrom(null)).toEqual(EMPTY_PAYMENT_DETAILS)
    expect(paymentDetailsFrom({ brandColour: '#123456' })).toEqual(EMPTY_PAYMENT_DETAILS)
  })

  it('keeps strings and ignores non-strings', () => {
    const result = paymentDetailsFrom({
      upiVpa: 'business@okicici',
      bankName: 42,
      accountName: 'Annapoorna Events',
      instructions: 'Pay before the event date.',
    })
    expect(result.upiVpa).toBe('business@okicici')
    expect(result.bankName).toBe('')
    expect(result.accountName).toBe('Annapoorna Events')
    expect(result.instructions).toBe('Pay before the event date.')
  })
})
