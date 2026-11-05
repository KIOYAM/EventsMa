'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Field, Input } from '@/components/ui/input'
import { updatePassword, type ResetState } from './actions'

const initial: ResetState = { error: null }

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Set new password'}
    </button>
  )
}

export function ResetForm() {
  const [state, action] = useActionState(updatePassword, initial)

  return (
    <form action={action} className="mt-5 space-y-4">
      <Field label="New password" htmlFor="password" hint="At least 8 characters, a letter and a number.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      {state.error ? (
        <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Submit />
    </form>
  )
}
