import type { PaymentDetails } from '@/lib/domain/ops'

function hasDetails(payment: PaymentDetails): boolean {
  return Boolean(
    payment.instructions ||
      payment.upiVpa ||
      payment.bankName ||
      payment.accountName ||
      payment.accountNumber ||
      payment.ifsc,
  )
}

/**
 * Customer-facing payment instructions. No gateway, no QR and no "Pay now"
 * button: money arrives by UPI or bank transfer, then the business records the
 * receipt against the invoice. That keeps every rupee in one append-only ledger.
 */
export function PaymentInstructions({
  payment,
  reference,
  amountLabel,
}: {
  payment: PaymentDetails
  reference: string
  amountLabel: string
}) {
  return (
    <section className="rounded-card border border-hairline bg-paper p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            How to pay
          </p>
          <h2 className="mt-1 text-base font-semibold text-ink">Manual payment</h2>
        </div>
        <p className="tabular text-sm font-medium text-forest">{amountLabel}</p>
      </div>

      {hasDetails(payment) ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {payment.upiVpa ? (
            <div>
              <dt className="text-xs text-ink-muted">UPI ID</dt>
              <dd className="mt-0.5 font-medium text-ink">{payment.upiVpa}</dd>
            </div>
          ) : null}
          {payment.bankName ? (
            <div>
              <dt className="text-xs text-ink-muted">Bank</dt>
              <dd className="mt-0.5 font-medium text-ink">{payment.bankName}</dd>
            </div>
          ) : null}
          {payment.accountName ? (
            <div>
              <dt className="text-xs text-ink-muted">Account name</dt>
              <dd className="mt-0.5 font-medium text-ink">{payment.accountName}</dd>
            </div>
          ) : null}
          {payment.accountNumber ? (
            <div>
              <dt className="text-xs text-ink-muted">Account number</dt>
              <dd className="mt-0.5 font-medium text-ink">{payment.accountNumber}</dd>
            </div>
          ) : null}
          {payment.ifsc ? (
            <div>
              <dt className="text-xs text-ink-muted">IFSC</dt>
              <dd className="mt-0.5 font-medium text-ink">{payment.ifsc}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          The business will share its bank or UPI details directly.
        </p>
      )}

      {payment.instructions ? (
        <p className="mt-4 whitespace-pre-line rounded-control bg-canvas px-3 py-2 text-sm leading-relaxed text-ink-muted">
          {payment.instructions}
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Quote reference <span className="font-medium text-ink">{reference}</span>. This page does
        not collect money online. Send the transfer reference to the business; they will record the
        receipt and issue a balance statement.
      </p>
    </section>
  )
}
