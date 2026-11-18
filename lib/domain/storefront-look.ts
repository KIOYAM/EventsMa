import type { StorefrontThemeKey } from './storefront'

/**
 * Three layouts, one markup tree.
 *
 * Each entry only changes rhythm and surface: spacing, type scale, whether a
 * service is a card or a ruled row, and whether the hero photo sits behind the
 * name or above it. Colours stay in tokens; the tenant's own brand colour is
 * applied as `--brand` on the wrapper and darkened into `--brand-ink` by CSS.
 *
 * Lives beside the section keys rather than inside the page so the renderer and
 * any future preview read the same object.
 */
export const STOREFRONT_LOOK = {
  editorial: {
    page: 'bg-canvas',
    hero: 'card-surface overflow-hidden',
    heroBody: 'p-6 sm:p-10',
    eyebrow: 'text-xs font-medium uppercase tracking-[0.14em] text-ink-muted',
    title: 'mt-2 text-4xl leading-[1.05] text-forest sm:text-5xl',
    lede: 'mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base',
    section: 'mt-10',
    heading: 'text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted',
    grid: 'mt-4 grid gap-3 sm:grid-cols-2',
    card: 'card-surface lift p-4',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'shrink-0 text-xs text-ink-muted',
    image: 'aspect-[21/9] w-full object-cover',
  },
  ledger: {
    page: 'bg-paper',
    hero: 'border-y border-hairline',
    heroBody: 'py-6 sm:py-8',
    eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted',
    title: 'mt-1 text-3xl leading-tight text-forest sm:text-4xl',
    lede: 'mt-2 max-w-2xl text-sm text-ink-muted',
    section: 'mt-8 border-t border-hairline pt-5',
    heading: 'text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted',
    grid: 'mt-3 divide-y divide-hairline',
    card: 'flex flex-wrap items-baseline justify-between gap-2 py-3',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'shrink-0 text-xs text-ink-muted',
    image: 'aspect-[3/1] w-full object-cover',
  },
  gallery: {
    page: 'bg-canvas',
    hero: 'relative overflow-hidden rounded-card bg-forest text-white',
    heroBody: 'relative p-8 sm:p-12',
    eyebrow: 'text-xs font-medium uppercase tracking-[0.16em] text-white/80',
    title: 'mt-2 text-4xl leading-[1.05] sm:text-5xl',
    lede: 'mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base',
    section: 'mt-8',
    heading: 'text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted',
    grid: 'mt-4 grid gap-3 sm:grid-cols-2',
    card: 'card-surface lift overflow-hidden',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'shrink-0 text-xs text-ink-muted',
    image: 'absolute inset-0 h-full w-full object-cover opacity-85',
  },
} as const

export type StorefrontLook = (typeof STOREFRONT_LOOK)[StorefrontThemeKey]
