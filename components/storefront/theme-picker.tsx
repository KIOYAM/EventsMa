import { Badge } from '@/components/ui/badge'
import {
  STOREFRONT_THEMES,
  type StorefrontThemeKey,
} from '@/lib/domain/storefront'
import { chooseTheme } from '@/app/(app)/storefront/actions'

interface Props {
  current: StorefrontThemeKey
  canEdit: boolean
  brandPrimary: string
}

/**
 * Pick a design, not a colour scheme.
 *
 * Every option renders a live swatch using the tenant's own brand colour, so the
 * choice is made against their palette rather than a generic preview. One form per
 * option keeps it keyboard-operable and JavaScript-free.
 */
export function ThemePicker({ current, canEdit, brandPrimary }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STOREFRONT_THEMES.map((theme) => {
        const active = theme.key === current
        return (
          <form key={theme.key} action={chooseTheme}>
            <input type="hidden" name="theme" value={theme.key} />
            <button
              type="submit"
              disabled={!canEdit}
              aria-pressed={active}
              className={`h-full w-full rounded-card border p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 disabled:hover:translate-y-0 ${
                active
                  ? 'border-forest bg-mint-subtle'
                  : 'border-hairline bg-paper hover:border-forest/40'
              } disabled:opacity-60`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{theme.label}</span>
                {active ? <Badge tone="success">In use</Badge> : null}
              </span>

              <span aria-hidden className="mt-3 flex gap-1.5">
                {theme.swatch.map((colour, index) => (
                  <span
                    key={colour + index}
                    className="h-6 w-6 rounded-full border border-hairline"
                    style={{ backgroundColor: index === 0 ? brandPrimary : colour }}
                  />
                ))}
              </span>

              <span className="mt-3 block text-xs leading-relaxed text-ink-muted">
                {theme.description}
              </span>
            </button>
          </form>
        )
      })}
    </div>
  )
}
