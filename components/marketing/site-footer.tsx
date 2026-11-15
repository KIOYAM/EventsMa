import Link from 'next/link'
import { Mail } from 'lucide-react'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'

const PRODUCT_LINKS = [
  { key: 'product', href: '#product' },
  { key: 'features', href: '#features' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'pricing', href: '#pricing' },
  { key: 'faq', href: '#faq' },
] as const

const SOLUTION_LINKS = [
  { key: 'catering', href: '#solutions', label: 'Catering' },
  { key: 'decor', href: '#solutions', label: 'Decor & styling' },
  { key: 'photography', href: '#solutions', label: 'Photography' },
  { key: 'eventPlanners', href: '#solutions', label: 'Event planners' },
] as const

export function SiteFooter({ locale = 'en' }: { locale?: Locale }) {
  const t = createTranslator(locale)

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
              {t('marketing.footer.description')}
            </p>
            <p className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/55">
              {t('marketing.footer.tagline')}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              {t('marketing.footer.product')}
            </p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className="text-[13px] text-white/55 hover:text-cream">
                    {t(`marketing.header.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              {t('marketing.footer.solutions')}
            </p>
            <ul className="mt-4 space-y-2.5">
              {SOLUTION_LINKS.map((row) => (
                <li key={row.key}>
                  <a href={row.href} className="text-[13px] text-white/55 hover:text-cream">
                    {row.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
              {t('marketing.footer.company')}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/signup" className="text-[13px] text-white/55 hover:text-cream">
                  {t('marketing.footer.getStarted')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[13px] text-white/55 hover:text-cream">
                  {t('marketing.footer.signIn')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[13px] text-white/55 hover:text-cream">
                  {t('marketing.footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13px] text-white/55 hover:text-cream">
                  {t('marketing.footer.terms')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:admin@eventsma.in"
                  className="inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-cream"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  {t('marketing.footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>Â© {new Date().getFullYear()} EventsMa. All rights reserved.</p>
          <p>{t('marketing.footer.manualPayments')}</p>
        </div>
      </div>
    </footer>
  )
}
