import Link from 'next/link'
import { ArrowRight, Clock, ShieldCheck, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-canvas">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-semibold text-white">
            E
          </span>
          <span className="font-display text-lg text-forest">EventsMa</span>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
        >
          Open workspace
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:pt-16">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          For businesses that provide more than one service
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] text-forest sm:text-5xl">
          Quote catering, decor and photography in one document — and know the margin before you
          send it.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ink-muted">
          Enable the services you actually provide. Each one gets its own catalogue, billing units
          and tax treatment. An event composes them into a single quote the family can accept.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center gap-2 rounded-control bg-forest px-5 text-sm font-medium text-white"
          >
            See the workspace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/quotes/new"
            className="inline-flex h-12 items-center rounded-control border border-hairline bg-paper px-5 text-sm text-ink"
          >
            Build a quote
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: 'Services, not verticals in code',
              body: 'Catering, decor, photography or a specialist service you define. A new service is configuration, never a new maths path.',
            },
            {
              icon: ShieldCheck,
              title: 'Server-verified money',
              body: 'Integer paise, per-line tax, rupee round-off. The preview is instant; the stored total is recomputed and frozen.',
            },
            {
              icon: Clock,
              title: 'Fast where it counts',
              body: 'Server-rendered lists, streamed dashboards, skeletons that hold their space, and no chart library on first paint.',
            },
          ].map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-card border border-hairline bg-paper p-5">
                <Icon className="h-5 w-5 text-forest" aria-hidden />
                <h2 className="mt-3 text-sm font-semibold text-ink">{feature.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 py-8 text-xs text-ink-muted">
        EventsMa · built for Coimbatore and beyond · no claim of new customers, just faster, honest
        quoting.
      </footer>
    </main>
  )
}
