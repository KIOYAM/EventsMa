import Link from 'next/link'
import { Field, Input } from '@/components/ui/input'

export const metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-hairline bg-paper p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-semibold text-white">
            E
          </span>
          <span className="font-display text-lg text-forest">EventsMa</span>
        </div>

        <h1 className="mt-5 text-lg font-semibold text-ink">Sign in to your workspace</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Email and password, magic link, and role-based access are provided by Supabase Auth.
        </p>

        <form className="mt-5 space-y-4">
          <Field label="Work email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@business.in" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="current-password" />
          </Field>
          <button
            type="submit"
            disabled
            className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white opacity-60"
          >
            Sign in
          </button>
        </form>

        <div className="mt-5 rounded-control bg-mint-subtle px-3 py-2.5 text-xs leading-relaxed text-forest">
          Auth is disabled until <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set. Until then the app runs in labelled
          demo mode — nothing here pretends to be a real session.
        </div>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex text-sm text-forest underline-offset-4 hover:underline"
        >
          Continue in demo mode
        </Link>
      </div>
    </main>
  )
}
