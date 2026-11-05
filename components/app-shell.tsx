import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { NavLinks } from '@/components/nav-links'
import { PerfMonitor } from '@/components/perf-monitor'
import { signOut } from '@/app/login/actions'

export function AppShell({
  children,
  businessName,
  demo,
  email,
  verticals,
}: {
  children: React.ReactNode
  businessName: string
  demo: boolean
  email: string | null
  /** Enabled service verticals; the sidebar shows only what the business offers. */
  verticals: readonly string[]
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <PerfMonitor />
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop rail: 252px, matching the prototype's information architecture. */}
        <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col border-r border-hairline bg-paper px-4 py-6 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-semibold text-white">
              E
            </span>
            <span className="font-display text-lg leading-none text-forest">EventsMa</span>
          </Link>

          <p className="mt-6 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Workspace
          </p>
          <NavLinks variant="rail" verticals={verticals} />

          <div className="mt-auto space-y-3 rounded-card border border-hairline bg-canvas p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Business
            </p>
            <p className="text-sm font-medium leading-snug text-ink">{businessName}</p>
            {demo ? (
              <Badge tone="warning" className="w-full justify-center">
                Demo data
              </Badge>
            ) : (
              <Badge tone="mint" className="w-full justify-center">
                Live workspace
              </Badge>
            )}
            {email ? (
              <form action={signOut}>
                <p className="truncate text-xs text-ink-muted">{email}</p>
                <button
                  type="submit"
                  className="mt-2 text-xs font-medium text-forest underline-offset-4 hover:underline"
                >
                  Sign out
                </button>
              </form>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-paper/95 px-4 backdrop-blur lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest text-xs font-semibold text-white">
                E
              </span>
              <span className="font-display text-base text-forest">EventsMa</span>
            </Link>
            {demo ? <Badge tone="warning">Demo data</Badge> : null}
          </header>

          <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            {children}
          </main>

          <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-hairline bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          >
            <NavLinks variant="mobile" verticals={verticals} />
          </nav>
        </div>
      </div>
    </div>
  )
}
