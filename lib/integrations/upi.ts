import 'server-only'

/**
 * Zero-fee UPI collection. The QR encodes a standard `upi://pay` intent, so any
 * Indian bank app can scan it without a payment gateway or a merchant contract.
 * Money is reconciled by the business against the reference note, not assumed.
 */

export function buildUpiUri({
  vpa,
  payeeName,
  amountPaise,
  note,
}: {
  vpa: string
  payeeName: string
  amountPaise: number
  note: string
}): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName.slice(0, 50),
    am: (Math.max(0, amountPaise) / 100).toFixed(2),
    cu: 'INR',
    tn: note.slice(0, 50),
  })
  return `upi://pay?${params.toString()}`
}

export async function buildUpiQrDataUrl(options: {
  vpa: string
  payeeName: string
  amountPaise: number
  note: string
}): Promise<string> {
  const QRCode = (await import('qrcode')).default
  return QRCode.toDataURL(buildUpiUri(options), {
    margin: 1,
    width: 240,
    color: { dark: '#183d33', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}
