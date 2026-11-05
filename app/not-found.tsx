import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md space-y-4 rounded-card border border-hairline bg-paper p-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">404</p>
        <h1 className="font-display text-2xl text-forest">This link does not exist</h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          Check the address, or go back to the business home page.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
