'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Boxes,
  CalendarDays,
  FileText,
  Send,
  Images,
  Inbox,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  Palette,
  Package,
  Receipt,
  Settings,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

interface NavEntry {
  readonly key: string
  readonly path: string
  readonly label: string
  readonly icon: string
  readonly group: 'sell' | 'catalogue' | 'business'
}

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Images,
  Layers,
  Package,
  Palette,
  FileText,
  CalendarDays,
  Wallet,
  Receipt,
  Settings,
  Store,
  TrendingUp,
  Users,
  Inbox,
  Boxes,
  BookOpen,
  LayoutGrid,
  Send,
}

function iconFor(name: string): LucideIcon {
  return ICON_MAP[name] ?? Package
}

/**
 * Route → catalogue key.
 *
 * The label on a nav entry comes from a vertical descriptor (data). This map is
 * the translation layer for the routes the platform owns; an unknown route keeps
 * its descriptor label instead of showing a key.
 */
const LABEL_KEYS: Record<string, string> = {
  '/clients': 'nav.clients',
  '/events': 'nav.events',
  '/submissions': 'nav.submissions',
  '/quotes': 'nav.quotes',
  '/invoices': 'nav.invoices',
  '/catering': 'nav.catering',
  '/catering/recipes': 'nav.recipes',
  '/photography': 'nav.photography',
  '/decoration': 'nav.decoration',
  '/makeup': 'nav.makeup',
  '/services/specialist': 'nav.specialist',
  '/finance': 'nav.finance',
  '/reports': 'nav.reports',
  '/team': 'nav.team',
  '/services': 'nav.services',
  '/portfolio': 'nav.portfolio',
  '/storefront': 'nav.storefront',
  '/settings': 'nav.settings',
}

/**
 * Four tabs plus "More".
 *
 * Four was the whole of mobile navigation, so every module outside this list —
 * quotes, catalogue, catering, reports, settings — was unreachable on a phone.
 * The fifth slot opens the same grouped registry the desktop rail renders, so a
 * new module appears on both surfaces without touching this file.
 */
const MOBILE = [
  { key: 'dashboard', path: '/dashboard', labelKey: 'nav.home', icon: 'LayoutGrid' },
  { key: 'clients', path: '/clients', labelKey: 'nav.clients', icon: 'Inbox' },
  { key: 'events', path: '/events', labelKey: 'nav.events', icon: 'CalendarDays' },
  { key: 'invoices', path: '/invoices', labelKey: 'nav.invoices', icon: 'Receipt' },
] as const

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavLinksProps {
  variant: 'rail' | 'mobile'
  entries?: readonly NavEntry[]
  locale: Locale
}

export function NavLinks({ variant, entries = [], locale }: NavLinksProps) {
  const pathname = usePathname()
  const t = createTranslator(locale)
  const [moreOpen, setMoreOpen] = useState(false)

  // Group entries by their declared group, preserving declaration order.
  const groups: { label: string; items: NavEntry[] }[] = []
  const groupOrder: ('sell' | 'catalogue' | 'business')[] = ['sell', 'catalogue', 'business']
  const groupKeys: Record<'sell' | 'catalogue' | 'business', string> = {
    sell: 'nav.groupSell',
    catalogue: 'nav.groupCatalogue',
    business: 'nav.groupBusiness',
  }

  for (const g of groupOrder) {
    const items = entries.filter((e) => e.group === g)
    if (items.length) groups.push({ label: t(groupKeys[g]), items })
  }

  if (variant === 'mobile') {
    return (
      <>
        <div className="contents">
          {MOBILE.map((item) => {
            const Icon = iconFor(item.icon)
            const active = isActive(pathname, item.path)
            return (
              <Link
                key={item.key}
                href={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[10px]',
                  active ? 'text-forest' : 'text-ink-muted',
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} aria-hidden />
                {t(item.labelKey)}
              </Link>
            )
          })}

          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="mobile-more"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              'flex h-16 flex-col items-center justify-center gap-1 text-[10px]',
              moreOpen ? 'text-forest' : 'text-ink-muted',
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            {t('nav.more')}
          </button>
        </div>

        {moreOpen ? (
          <>
            <button
              type="button"
              aria-label={t('nav.closeMenu')}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-30 bg-ink/25"
            />
            <div
              id="mobile-more"
              className="fixed inset-x-0 bottom-16 z-40 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-hairline bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-xl"
            >
              {groups.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-0.5">
                    {group.items.map((item) => {
                      const Icon = iconFor(item.icon)
                      const active = isActive(pathname, item.path)
                      const labelKey = LABEL_KEYS[item.path]
                      return (
                        <Link
                          key={item.key}
                          href={item.path}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'flex min-h-11 items-center gap-2 rounded-control px-2 text-sm',
                            active
                              ? 'bg-mint font-medium text-forest'
                              : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{labelKey ? t(labelKey) : item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              <Link
                href="/me"
                aria-current={isActive(pathname, '/me') ? 'page' : undefined}
                onClick={() => setMoreOpen(false)}
                className="mt-1 flex min-h-11 items-center gap-2 border-t border-hairline px-2 pt-2 text-sm text-ink-muted"
              >
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                {t('nav.myWork')}
              </Link>
            </div>
          </>
        ) : null}
      </>
    )
  }

  return (
    <nav
      className="no-scrollbar mt-2 flex-1 space-y-4 overflow-y-auto pb-4"
      aria-label={t('nav.shell.workspace')}
    >
      <Link
        href="/dashboard"
        aria-current={pathname === '/dashboard' ? 'page' : undefined}
        className={cn(
          'flex h-10 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
          pathname === '/dashboard'
            ? 'bg-mint font-medium text-forest'
            : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        {t('nav.dashboard')}
      </Link>

      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = iconFor(item.icon)
              const active = isActive(pathname, item.path)
              const labelKey = LABEL_KEYS[item.path]
              return (
                <Link
                  key={item.key}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    // 44px minimum: the ui-skills-collection rule. A 36px row is a
                    // miss with a thumb, and the rail is long enough to scroll anyway.
                    'flex min-h-11 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
                    active
                      ? 'bg-mint font-medium text-forest'
                      : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {labelKey ? t(labelKey) : item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-hairline pt-3">
        <Link
          href="/me"
          aria-current={isActive(pathname, '/me') ? 'page' : undefined}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
            isActive(pathname, '/me')
              ? 'bg-mint font-medium text-forest'
              : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
          )}
        >
          <Users className="h-4 w-4" aria-hidden />
          {t('nav.myWork')}
        </Link>
      </div>
    </nav>
  )
}
