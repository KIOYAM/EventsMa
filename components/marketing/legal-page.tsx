import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="landing-dark min-h-dvh bg-night text-cream">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/55 transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to EventsMa
        </Link>
        <h1 className="mt-6 font-display text-3xl leading-tight tracking-[-0.025em] text-cream sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-xs text-white/55">Last updated {updated}</p>
        <div className="mt-10 space-y-9">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-display text-xl text-cream">{title}</h2>
      <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-white/60">{children}</div>
    </section>
  )
}
