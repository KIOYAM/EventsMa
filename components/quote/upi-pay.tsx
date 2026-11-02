import { formatINR } from '@/lib/domain/money'
import { buildUpiQrDataUrl } from '@/lib/integrations/upi'

/**
 * Server-rendered UPI card. The VPA comes from the environment until tenant
 * payout settings are modelled; a business without a VPA simply sees no card.
 */
export async function UpiPayCard({
  amountPaise,
  payeeName,
  reference,
}: {
  amountPaise: number
  payeeName: string
  reference: string
}) {
  const vpa = process.env.BUSINESS_UPI_VPA
  if (!vpa || amountPaise <= 0) return null

  const qr = await buildUpiQrDataUrl({
    vpa,
    payeeName,
    amountPaise,
    note: reference,
  })

  return (
    <section className="rounded-card border border-hairline bg-paper p-5">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
        Pay by UPI
      </p>
      <div className="mt-3 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={`UPI payment QR for ${formatINR(amountPaise)}`}
          width={132}
          height={132}
          className="h-[132px] w-[132px] rounded-control border border-hairline"
        />
        <div>
          <p className="tabular text-lg font-semibold text-forest">{formatINR(amountPaise)}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Scan with any UPI app and pay the amount shown. Add{' '}
            <span className="font-medium text-ink">{reference}</span> as the note so the business can
            match your payment.
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">
        No card details are collected here. The business confirms receipt.
      </p>
    </section>
  )
}
