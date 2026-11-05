import Link from 'next/link'
import { Mail } from 'lucide-react'

const PRODUCT_LINKS = [
  ['Product', '#product'],
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
] as const

const SOLUTION_LINKS = [
  ['Catering', '#solutions'],
  ['Decor & styling', '#solutions'],
  ['Photography', '#solutions'],
  ['Event planners', '#solutions'],
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-night">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.9fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-xl bg-mint-bright text-sm font-semibold text-forest"
              >
                E
              </span>
              <span className="font-display text-xl text-cream">EventsMa</span>
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-white/50">
              One workspace for catering, decor, photography and every other event service you
              provide. Price it, quote it and know the margin before you send it.
            </p>
            <p className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/55">
              Built for Coimbatore and beyond
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              Product
            </p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-[13px] text-white/55 hover:text-cream">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              Solutions
            </p>
            <ul className="mt-4 space-y-2.5">
              {SOLUTION_LINKS.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-[13px] text-white/55 hover:text-cream">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              Company
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/signup" className="text-[13px] text-white/55 hover:text-cream">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[13px] text-white/55 hover:text-cream">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[13px] text-white/55 hover:text-cream">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13px] text-white/55 hover:text-cream">
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href="mailto:admin@eventsma.in"
                  className="inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-cream"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>Â© {new Date().getFullYear()} EventsMa. All rights reserved.</p>
          <p>
            Manual payments only. EventsMa does not collect customer payments or store card data.
          </p>
        </div>
      </div>
    </footer>
  )
}
