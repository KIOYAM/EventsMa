import Link from 'next/link'

export default function WorkspaceNotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 card-surface p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">404</p>
      <h1 className="font-display text-2xl text-forest">That record is gone or belongs elsewhere</h1>
      <p className="text-sm leading-relaxed text-ink-muted">
        The link may be old, or the record may belong to another business. Nothing was changed.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="btn btn-sm btn-primary"
        >
          Dashboard
        </Link>
        <Link
          href="/events"
          className="inline-flex h-10 items-center rounded-control border border-hairline px-4 text-sm text-ink"
        >
          Events
        </Link>
      </div>
    </div>
  )
}
