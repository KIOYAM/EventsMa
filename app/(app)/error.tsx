'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(JSON.stringify({ kind: 'workspace-error', digest: error.digest }))
  }, [error])

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-card border border-hairline bg-paper p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Something went wrong
      </p>
      <h1 className="font-display text-2xl text-forest">This screen could not load</h1>
      <p className="text-sm leading-relaxed text-ink-muted">
        Nothing was saved by the failed request. Try again; if it keeps happening, send the
        reference below to support.
      </p>
      {error.digest ? (
        <p className="rounded-control bg-canvas px-3 py-2 text-xs text-ink-muted">
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-control border border-hairline px-4 text-sm text-ink"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
