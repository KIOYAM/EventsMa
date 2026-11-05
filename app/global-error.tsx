'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#f7f2e7] p-6 text-[#1d2a24]">
        <main className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#e4ddcf] bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6f7a73]">
            EventsMa
          </p>
          <h1 className="text-2xl font-semibold text-[#1f4d3a]">The app could not start</h1>
          <p className="text-sm leading-relaxed text-[#6f7a73]">
            A server error stopped this page before it rendered. Try again. If the problem
            continues, the deployment logs have the reference below.
          </p>
          {error.digest ? (
            <p className="rounded-lg bg-[#f7f2e7] px-3 py-2 text-xs text-[#6f7a73]">
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-[#1f4d3a] px-4 text-sm font-medium text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
