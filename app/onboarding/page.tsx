import Link from 'next/link'

export const metadata = { title: 'Set up your workspace' }

export default function OnboardingPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-lg rounded-card border border-hairline bg-paper p-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">Onboarding</p>
        <h1 className="mt-2 font-display text-2xl text-forest">
          This account has no workspace yet
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          A workspace is created with one organisation, one business profile and an owner
          membership. The database function <code className="rounded bg-canvas px-1">bootstrap_org</code>{' '}
          performs all three in a single transaction, so a half-created tenant cannot exist.
        </p>

        <ol className="mt-5 space-y-2 text-sm text-ink">
          <li>1. Connect Supabase and run the migrations.</li>
          <li>2. Apply <code>db/policies.sql</code> for row-level security.</li>
          <li>3. Sign in with a verified email to create the workspace.</li>
        </ol>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
        >
          Back to the demo workspace
        </Link>
      </div>
    </main>
  )
}
