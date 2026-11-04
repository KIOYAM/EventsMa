import Link from 'next/link'

/**
 * The one card every auth screen sits in. Sign-in and sign-up are two links in
 * the same pair of tabs, so nobody has to guess which form they are looking at.
 */
export function AuthShell({
  active,
  step,
  title,
  description,
  children,
}: {
  active: 'signin' | 'signup'
  step: string
  title: string
  description: string
  children: React.ReactNode
}) {
  const tabs = [
    { id: 'signin' as const, href: '/login', label: 'Sign in' },
    { id: 'signup' as const, href: '/signup', label: 'Create account' },
  ]

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-semibold text-white">
            E
          </span>
          <span className="font-display text-lg text-forest">EventsMa</span>
        </div>

        <div className="mt-5 rounded-card border border-hairline bg-paper p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-1 rounded-control bg-canvas p-1 text-sm font-medium">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active === tab.id ? 'page' : undefined}
                className={
                  active === tab.id
                    ? 'rounded-control bg-paper px-3 py-2 text-center text-forest shadow-sm'
                    : 'rounded-control px-3 py-2 text-center text-ink-muted hover:text-ink'
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {step}
          </p>
          <h1 className="mt-1.5 text-lg font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>

          {children}
        </div>

        <p className="mt-4 px-1 text-xs leading-relaxed text-ink-muted">
          Built for event businesses — catering, decor, photography, planning. Quotes, invoices and
          margin in one workspace.
        </p>
      </div>
    </main>
  )
}
