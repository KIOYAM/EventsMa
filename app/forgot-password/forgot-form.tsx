'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Field, Input } from '@/components/ui/input'
import { requestPasswordReset, type ForgotState } from './actions'

const initial: ForgotState = { error: null, sent: false }

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Sending…' : 'Send reset link'}
    </button>
  )
}

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, initial)

  if (state.sent) {
    return (
      <div className="mt-5 space-y-3">
        <div role="status" className="rounded-control border border-mint bg-mint-subtle px-3 py-2.5 text-sm leading-relaxed text-forest">
          If that email has an account, a reset link is on its way. The link expires after one use.
        </div>
        <Link href="/login" className="inline-block text-sm text-forest underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="mt-5 space-y-4">
      <Field label="Work email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@yourbusiness.in"
        />
      </Field>
      {state.error ? (
        <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Submit />
      <Link href="/login" className="block text-center text-xs text-ink-muted underline underline-offset-4">
        Back to sign in
      </Link>
    </form>
  )
}
