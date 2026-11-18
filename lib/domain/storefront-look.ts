import type { StorefrontThemeKey } from './storefront'

/**
 * Three layouts, one markup tree.
 *
 * The page follows the shape the product was designed around: a full-bleed
 * opening with the name on a photograph or the owner's colour, then centred
 * sections with a small uppercase overline, a serif heading and one sentence of
 * context, then a dark closing band. Only rhythm, width and surface change
 * between themes — the markup never branches on the theme except for the hero,
 * which is either dark (white type on brand) or light (ink on paper).
 *
 * The tenant's own colour arrives as `--brand`; `--brand-ink` is that colour
 * darkened far enough for white text by the CSS in `globals.css`.
 */
export const STOREFRONT_LOOK = {
  /** Warm editorial: widest column, serif display, airy sections. */
  editorial: {
    page: 'bg-canvas',
    shell: 'mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 md:pb-0 lg:px-8',
    heroTone: 'dark' as const,
    hero: 'relative isolate flex min-h-[30rem] items-end overflow-hidden rounded-[26px] text-white sm:min-h-[34rem]',
    heroPhoto: 'absolute inset-0 h-full w-full object-cover',
    heroShade: 'absolute inset-0 bg-gradient-to-r from-night/95 via-night/70 to-night/10',
    heroBody: 'relative w-full px-6 py-12 sm:px-12 sm:py-16',
    overline: 'text-[10px] font-bold tracking-[0.22em] text-gold uppercase',
    title: 'mt-4 max-w-2xl text-[2.5rem] leading-[1.03] tracking-[-0.02em] sm:text-6xl',
    lede: 'mt-4 max-w-xl text-sm leading-[1.8] text-white/80 sm:text-base',
    meta: 'mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/70',
    ctaPrimary:
      'inline-flex items-center justify-center gap-2 rounded-control bg-white px-5 py-3 text-sm font-semibold text-[color:var(--brand-ink)] transition hover:bg-white/90',
    ctaGhost:
      'inline-flex items-center justify-center gap-2 rounded-control border border-white/40 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/80',
    section: 'px-1 py-14 sm:py-16',
    sectionTint: 'rounded-[26px] bg-sunken px-5 sm:px-8',
    headWrap: 'mx-auto max-w-2xl text-center',
    headLeft: 'max-w-2xl',
    heading: 'mt-3 font-[family-name:var(--font-display)] text-[1.85rem] leading-tight tracking-[-0.02em] text-forest sm:text-[2.35rem]',
    subhead: 'mt-3 text-sm leading-[1.8] text-ink-muted',
    rule: 'mx-auto mt-4 h-px w-12 bg-[color:var(--brand)]',
    grid: 'mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
    gridWide: 'mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
    card: 'card-surface lift overflow-hidden',
    cardBody: 'p-5',
    cardTitle: 'text-sm font-semibold text-ink',
    count: 'text-[10px] font-semibold tracking-[0.14em] text-ink-muted uppercase',
    muted: 'text-ink-muted',
    price: 'text-lg font-semibold text-forest',
    chip: 'rounded-pill border border-hairline bg-paper px-2.5 py-1 text-xs text-ink-muted',
    link: 'inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--brand-ink)] hover:underline',
    tile: 'group relative overflow-hidden rounded-card bg-sunken',
    divider: 'divide-y divide-hairline',
    band: 'mt-4 overflow-hidden rounded-[26px] bg-forest px-6 py-10 text-white sm:px-12 sm:py-12',
    bandTitle: 'mt-3 font-[family-name:var(--font-display)] text-[1.9rem] leading-tight sm:text-[2.4rem]',
    bandMuted: 'mt-3 max-w-xl text-sm leading-relaxed text-white/70',
    footer: 'mt-10 border-t border-hairline py-8 text-xs text-ink-muted',
  },

  /** Compact and businesslike: a light hero, tighter sections, ruled cards. */
  ledger: {
    page: 'bg-paper',
    shell: 'mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6 md:pb-0',
    heroTone: 'light' as const,
    hero: 'relative isolate overflow-hidden rounded-card border border-hairline',
    heroPhoto: 'absolute inset-0 h-full w-full object-cover opacity-25',
    heroShade: 'absolute inset-0 bg-gradient-to-r from-paper via-paper/90 to-paper/40',
    heroBody: 'relative w-full px-6 py-10 sm:px-10 sm:py-12',
    overline: 'text-[10px] font-bold tracking-[0.2em] text-terracotta uppercase',
    title: 'mt-3 font-[family-name:var(--font-display)] text-[2rem] leading-[1.05] text-forest sm:text-5xl',
    lede: 'mt-3 max-w-xl text-sm leading-relaxed text-ink-muted',
    meta: 'mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-muted',
    ctaPrimary:
      'inline-flex items-center justify-center gap-2 rounded-control bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-hover',
    ctaGhost:
      'inline-flex items-center justify-center gap-2 rounded-control border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-forest/40',
    section: 'py-10',
    sectionTint: 'rounded-card bg-sunken px-5 py-2',
    headWrap: 'max-w-2xl',
    headLeft: 'max-w-2xl',
    heading: 'mt-2 text-xl font-semibold tracking-[-0.01em] text-ink sm:text-2xl',
    subhead: 'mt-2 text-sm leading-relaxed text-ink-muted',
    rule: 'mt-3 h-px w-10 bg-forest',
    grid: 'mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
    gridWide: 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
    card: 'rounded-card border border-hairline bg-paper',
    cardBody: 'p-4',
    cardTitle: 'text-sm font-medium text-ink',
    count: 'text-[10px] font-semibold tracking-[0.12em] text-ink-muted uppercase',
    muted: 'text-ink-muted',
    price: 'text-base font-semibold text-ink',
    chip: 'rounded-pill border border-hairline px-2 py-0.5 text-xs text-ink-muted',
    link: 'inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline',
    tile: 'group relative overflow-hidden rounded-card bg-sunken',
    divider: 'divide-y divide-hairline',
    band: 'rounded-card bg-forest px-6 py-9 text-white',
    bandTitle: 'mt-2 font-[family-name:var(--font-display)] text-2xl leading-tight',
    bandMuted: 'mt-2 max-w-xl text-sm leading-relaxed text-white/70',
    footer: 'mt-8 border-t border-hairline py-6 text-xs text-ink-muted',
  },

  /** Photo-forward and dark: the page recedes so the work carries it. */
  gallery: {
    page: 'bg-night',
    shell: 'mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 md:pb-0 lg:px-8',
    heroTone: 'dark' as const,
    hero: 'relative isolate flex min-h-[32rem] items-end overflow-hidden text-white',
    heroPhoto: 'absolute inset-0 h-full w-full object-cover',
    heroShade: 'absolute inset-0 bg-gradient-to-r from-night/95 via-night/70 to-night/20',
    heroBody: 'relative w-full px-6 py-12 sm:px-10 sm:py-16',
    overline: 'text-[10px] font-bold tracking-[0.22em] text-gold uppercase',
    title: 'mt-4 max-w-2xl text-[2.6rem] leading-[1.02] sm:text-6xl',
    lede: 'mt-4 max-w-xl text-sm leading-[1.8] text-white/70 sm:text-base',
    meta: 'mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/55',
    ctaPrimary:
      'inline-flex items-center justify-center gap-2 rounded-control bg-mint px-5 py-3 text-sm font-semibold text-night transition hover:bg-mint-bright',
    ctaGhost:
      'inline-flex items-center justify-center gap-2 rounded-control border border-white/35 px-5 py-3 text-sm font-medium text-white transition hover:border-white/70',
    section: 'py-16',
    sectionTint: 'rounded-[26px] bg-night-soft px-5 sm:px-8',
    headWrap: 'mx-auto max-w-2xl text-center',
    headLeft: 'max-w-2xl',
    heading: 'mt-3 text-[1.9rem] leading-tight tracking-[-0.02em] text-white sm:text-[2.4rem]',
    subhead: 'mt-3 text-sm leading-[1.8] text-white/60',
    rule: 'mx-auto mt-4 h-px w-12 bg-mint/70',
    grid: 'mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
    gridWide: 'mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
    card: 'lift overflow-hidden rounded-card border border-white/10 bg-night-card transition hover:border-white/25',
    cardBody: 'p-5',
    cardTitle: 'text-sm font-semibold text-white',
    count: 'text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase',
    muted: 'text-white/55',
    price: 'text-lg font-semibold text-white',
    chip: 'rounded-pill border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/70',
    link: 'inline-flex items-center gap-1.5 text-xs font-semibold text-mint hover:underline',
    tile: 'group relative overflow-hidden rounded-card bg-night-soft',
    divider: 'divide-y divide-white/10',
    band: 'overflow-hidden rounded-[26px] bg-night-card px-6 py-10 text-white ring-1 ring-white/10 sm:px-12',
    bandTitle: 'mt-3 text-[1.9rem] leading-tight sm:text-[2.4rem]',
    bandMuted: 'mt-3 max-w-xl text-sm leading-relaxed text-white/60',
    footer: 'mt-10 border-t border-white/10 py-8 text-xs text-white/50',
  },
} as const

export type StorefrontLook = (typeof STOREFRONT_LOOK)[StorefrontThemeKey]
