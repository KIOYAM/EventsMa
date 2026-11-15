'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'

const LINKS = [
  { href: '#product', labelKey: 'marketing.header.product' },
  { href: '#features', labelKey: 'marketing.header.features' },
  { href: '#solutions', labelKey: 'marketing.header.solutions' },
  { href: '#how-it-works', labelKey: 'marketing.header.howItWorks' },
  { href: '#pricing', labelKey: 'marketing.header.pricing' },
  { href: '#faq', labelKey: 'marketing.header.faq' },
] as const

export function SiteHeader({ locale = 'en' }: { locale?: Locale }) {
  const [open, setOpen] = useState(false)
  const t = createTranslator(locale)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:h-[76px] lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-mint-bright text-sm font-semibold text-forest"
          >
            E
          </span>
          <span className="font-display text-xl tracking-[-0.02em] text-cream">EventsMa</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-white/65 transition-colors hover:text-cream focus-visible:text-cream"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-control px-4 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-cream"
          >
            {t('auth.shell.tabs.signin')}
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-1.5 rounded-control bg-mint-bright px-4 text-sm font-medium text-forest transition-colors hover:bg-mint"
          >
            {t('marketing.header.getStarted')}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-control text-cream hover:bg-white/5 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? t('marketing.header.closeNavigation') : t('marketing.header.openNavigation')}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <div id="mobile-navigation" className="border-t border-white/10 bg-night lg:hidden">
          <nav
            className="mx-auto grid w-full max-w-7xl gap-1 px-5 py-4 sm:px-8"
            aria-label="Mobile navigation"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-control px-3 text-sm text-white/75 hover:bg-white/5 hover:text-cream"
              >
                {t(link.labelKey)}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-control border border-white/15 text-sm text-cream"
                onClick={() => setOpen(false)}
              >
                {t('auth.shell.tabs.signin')}
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-control bg-mint-bright text-sm font-medium text-forest"
                onClick={() => setOpen(false)}
              >
                {t('marketing.header.getStarted')}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
