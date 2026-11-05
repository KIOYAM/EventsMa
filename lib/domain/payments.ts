import type { PaymentDetails } from './ops'

export const EMPTY_PAYMENT_DETAILS: PaymentDetails = {
  instructions: '',
  upiVpa: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifsc: '',
}

/** Tolerates older organisations whose settings JSON predates manual payments. */
export function paymentDetailsFrom(value: unknown): PaymentDetails {
  if (!value || typeof value !== 'object') return { ...EMPTY_PAYMENT_DETAILS }
  const raw = value as Record<string, unknown>
  const text = (key: keyof PaymentDetails) =>
    typeof raw[key] === 'string' ? (raw[key] as string) : ''
  return {
    instructions: text('instructions'),
    upiVpa: text('upiVpa'),
    bankName: text('bankName'),
    accountName: text('accountName'),
    accountNumber: text('accountNumber'),
    ifsc: text('ifsc'),
  }
}
