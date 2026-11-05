'use client'

import { useFormStatus } from 'react-dom'
import { Field, Input } from '@/components/ui/input'
import { acceptQuote } from '@/app/q/[token]/actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Recording acceptance…' : 'Accept this quotation'}
    </button>
  )
}

export function AcceptQuoteForm({ token }: { token: string }) {
  return (
    <form action={acceptQuote} className="rounded-card border border-hairline bg-paper p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Ready to proceed
      </p>
      <h2 className="mt-1 text-base font-semibold text-ink">Accept this quotation</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        This records your acceptance against the quote. It does not take a payment or lock a card.
      </p>

      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="accepted" value="yes" />

      <div className="mt-4">
        <Field
          label="Your email (optional)"
          htmlFor="acceptEmail"
          hint="Used only to identify who accepted this version."
        >
          <Input
            id="acceptEmail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={200}
          />
        </Field>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-hairline" />
        <span>
          I accept the services, quantities and total above. I understand the business will confirm
          the date and collect payment separately.
        </span>
      </label>

      <div className="mt-4">
        <Submit />
      </div>
    </form>
  )
}
