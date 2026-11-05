'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Field, Input } from '@/components/ui/input'
import { signUp, type SignupState } from './actions'

const initial: SignupState = { error: null, sentTo: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Creating your account…' : 'Create account and continue'}
    </button>
  )
}

export function SignupForm({ next = '/onboarding' }: { next?: string }) {
  const [state, formAction] = useActionState(signUp, initial)

  if (state.sentTo) {
    return (
      <div className="mt-5 space-y-3">
        <div className="rounded-control bg-mint-subtle px-3 py-2.5 text-sm leading-relaxed text-forest">
          Confirm your email to finish. We sent a link to{' '}
          <span className="font-medium">{state.sentTo}</span>.
        </div>
        <p className="text-sm text-ink-muted">
          Open the link, then sign in. The next screen asks for your business name, city and the
          services you sell.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-control border border-hairline px-4 text-sm font-medium text-ink"
        >
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Work email" htmlFor="email" hint="This becomes your login for the business.">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@yourbusiness.in"
        />
      </Field>
      <Field label="Create password" htmlFor="password" hint="At least 8 characters, a letter and a number.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <Field label="Confirm password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>

      {state.error ? (
        <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-xs leading-relaxed text-ink-muted">
        Next step: your business name, city, phone and the services you provide. No card, no trial
        countdown.
      </p>
    </form>
  )
}
