import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StorefrontDesign } from '@/lib/domain/storefront-design'
import { saveDesign } from '@/app/(app)/storefront/actions'

const FIELD =
  'mt-1 h-11 w-full rounded-control border border-hairline bg-paper px-3 text-sm text-ink disabled:opacity-60'
const LABEL = 'text-xs text-ink-muted'
const SAVE = 'btn btn-sm btn-primary h-11 disabled:opacity-40'

export interface DesignLabels {
  title: string
  body: string
  look: string
  accent: string
  accentHint: string
  themeAccent: string
  surface: string
  surfaceTheme: string
  surfaceCanvas: string
  surfacePaper: string
  corners: string
  cornersSharp: string
  cornersSoft: string
  cornersRound: string
  spacing: string
  spacingCompact: string
  spacingRegular: string
  spacingAiry: string
  heroHeight: string
  heroShort: string
  heroMedium: string
  heroTall: string
  cta: string
  ctaPlaceholder: string
  announcement: string
  announcementPlaceholder: string
  channels: string
  channelsBody: string
  whatsapp: string
  whatsappPlaceholder: string
  instagram: string
  instagramPlaceholder: string
  email: string
  emailPlaceholder: string
  save: string
  hint: string
}

function Choices({
  name,
  label,
  current,
  options,
  disabled,
}: {
  name: string
  label: string
  current: string
  options: { value: string; label: string }[]
  disabled: boolean
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <select name={name} defaultValue={current} disabled={disabled} className={FIELD}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * The fine design layer and the owner's contact channels.
 *
 * Both are one form because they are one thought — "how should my page feel, and
 * where should a client write to me". The values post raw; `saveDesign` validates
 * them through `resolveDesign`, so nothing typed here can reach a page unchecked.
 */
export function DesignForm({
  design,
  canEdit,
  labels,
}: {
  design: StorefrontDesign
  canEdit: boolean
  labels: DesignLabels
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-muted">{labels.body}</p>

        <form action={saveDesign} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-ink">{labels.look}</legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>{labels.accent}</span>
                <input
                  type="color"
                  name="accent"
                  defaultValue={design.accent ?? '#8a6524'}
                  disabled={!canEdit}
                  className="mt-1 h-11 w-full rounded-control border border-hairline bg-paper px-1 disabled:opacity-60"
                />
                <span className="mt-1 block text-xs text-ink-muted">{labels.accentHint}</span>
              </label>

              <label className="flex items-start gap-2 rounded-control border border-hairline bg-canvas/60 p-3">
                <input
                  type="checkbox"
                  name="themeAccent"
                  value="1"
                  defaultChecked={design.accent === null}
                  disabled={!canEdit}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm text-ink">{labels.themeAccent}</span>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Choices
                name="surface"
                label={labels.surface}
                current={design.surface}
                disabled={!canEdit}
                options={[
                  { value: 'theme', label: labels.surfaceTheme },
                  { value: 'canvas', label: labels.surfaceCanvas },
                  { value: 'paper', label: labels.surfacePaper },
                ]}
              />
              <Choices
                name="corners"
                label={labels.corners}
                current={design.corners}
                disabled={!canEdit}
                options={[
                  { value: 'sharp', label: labels.cornersSharp },
                  { value: 'soft', label: labels.cornersSoft },
                  { value: 'round', label: labels.cornersRound },
                ]}
              />
              <Choices
                name="spacing"
                label={labels.spacing}
                current={design.spacing}
                disabled={!canEdit}
                options={[
                  { value: 'compact', label: labels.spacingCompact },
                  { value: 'regular', label: labels.spacingRegular },
                  { value: 'airy', label: labels.spacingAiry },
                ]}
              />
              <Choices
                name="heroHeight"
                label={labels.heroHeight}
                current={design.heroHeight}
                disabled={!canEdit}
                options={[
                  { value: 'short', label: labels.heroShort },
                  { value: 'medium', label: labels.heroMedium },
                  { value: 'tall', label: labels.heroTall },
                ]}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>{labels.cta}</span>
                <input
                  name="ctaLabel"
                  defaultValue={design.ctaLabel ?? ''}
                  maxLength={40}
                  disabled={!canEdit}
                  placeholder={labels.ctaPlaceholder}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{labels.announcement}</span>
                <input
                  name="announcement"
                  defaultValue={design.announcement ?? ''}
                  maxLength={120}
                  disabled={!canEdit}
                  placeholder={labels.announcementPlaceholder}
                  className={FIELD}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-hairline pt-4">
            <legend className="text-sm font-medium text-ink">{labels.channels}</legend>
            <p className="text-xs text-ink-muted">{labels.channelsBody}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={LABEL}>{labels.whatsapp}</span>
                <input
                  name="whatsapp"
                  type="tel"
                  defaultValue={design.whatsapp ?? ''}
                  maxLength={20}
                  disabled={!canEdit}
                  placeholder={labels.whatsappPlaceholder}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{labels.instagram}</span>
                <input
                  name="instagram"
                  defaultValue={design.instagram ?? ''}
                  maxLength={60}
                  disabled={!canEdit}
                  placeholder={labels.instagramPlaceholder}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{labels.email}</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={design.email ?? ''}
                  maxLength={120}
                  disabled={!canEdit}
                  placeholder={labels.emailPlaceholder}
                  className={FIELD}
                />
              </label>
            </div>
          </fieldset>

          <button type="submit" disabled={!canEdit} className={SAVE}>
            {labels.save}
          </button>
        </form>

        <p className="text-xs text-ink-muted">{labels.hint}</p>
      </CardContent>
    </Card>
  )
}
