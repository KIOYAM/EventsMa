'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Boxes,
  CalendarDays,
  FileText,
  Images,
  Inbox,
  Layers,
  LayoutGrid,
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
}

function iconFor(name: string): LucideIcon {
  return ICON_MAP[name] ?? Package
}

/** Four tabs, because a fifth target is a miss on a phone held one-handed. */
const MOBILE: NavEntry[] = [
  { key: 'dashboard', path: '/dashboard', label: 'Home', icon: 'LayoutGrid', group: 'sell' },
  { key: 'clients', path: '/clients', label: 'Clients', icon: 'Inbox', group: 'sell' },
  { key: 'events', path: '/events', label: 'Events', icon: 'CalendarDays', group: 'sell' },
  { key: 'invoices', path: '/invoices', label: 'Invoices', icon: 'Receipt', group: 'sell' },
] as const

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavLinksProps {
  variant: 'rail' | 'mobile'
  entries?: readonly NavEntry[]
}

export function NavLinks({ variant, entries = [] }: NavLinksProps) {
  const pathname = usePathname()

  // Group entries by their declared group, preserving declaration order.
  const groups: { label: string; items: NavEntry[] }[] = []
  const groupOrder: ('sell' | 'catalogue' | 'business')[] = ['sell', 'catalogue', 'business']
  const groupLabels: Record<'sell' | 'catalogue' | 'business', string> = {
    sell: 'Sell',
    catalogue: 'Catalogue',
    business: 'Business',
  }

  for (const g of groupOrder) {
    const items = entries.filter((e) => e.group === g)
    if (items.length) groups.push({ label: groupLabels[g], items })
  }

  if (variant === 'mobile') {
    return (
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
              {item.label}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <nav className="no-scrollbar mt-2 flex-1 space-y-4 overflow-y-auto pb-4" aria-label="Workspace">
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
        Dashboard
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
              return (
                <Link
                  key={item.key}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
                    active
                      ? 'bg-mint font-medium text-forest'
                      : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
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
          My work
        </Link>
      </div>
    </nav>
  )
}
