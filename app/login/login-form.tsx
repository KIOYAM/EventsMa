'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Field, Input } from '@/components/ui/input'
import { signIn, type LoginState } from './actions'

const initial: LoginState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in to my workspace'}
    </button>
  )
}

export function LoginForm({ next = '/dashboard' }: { next?: string }) {
  const [state, formAction] = useActionState(signIn, initial)

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Work email" htmlFor="email" hint="The email you signed up with.">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@yourbusiness.in"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <p className="-mt-1 text-right text-xs">
        <Link href="/forgot-password" className="text-forest underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </p>

      {state.error ? (
        <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}{' '}
          <Link href="/signup" className="underline underline-offset-4">
            Create an account
          </Link>
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
