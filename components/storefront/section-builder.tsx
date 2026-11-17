import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SECTION_HINT, SECTION_LABEL, type StorefrontSection } from '@/lib/domain/storefront'
import {
  clearSectionImage,
  reorderSection,
  saveSectionHeading,
  toggleSection,
  uploadSectionImage,
} from '@/app/(app)/storefront/actions'

interface Props {
  sections: StorefrontSection[]
  canEdit: boolean
  storageReady: boolean
}

/**
 * The storefront layout editor.
 *
 * Zero client JavaScript: every control is a form that posts to a server action.
 * That keeps the builder working on a phone with a bad connection and means the
 * order lives in Postgres, not in a browser store that a refresh forgets.
 */
export function SectionBuilder({ sections, canEdit, storageReady }: Props) {
  return (
    <ol className="divide-y divide-hairline">
      {sections.map((section, index) => {
        const first = index === 0
        const last = index === sections.length - 1

        return (
          <li key={section.key} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint-subtle text-xs font-medium text-forest"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{SECTION_LABEL[section.key]}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {SECTION_HINT[section.key]}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={section.visible ? 'success' : 'outline'}>
                  {section.visible ? 'Shown' : 'Hidden'}
                </Badge>

                <form action={reorderSection}>
                  <input type="hidden" name="key" value={section.key} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={!canEdit || first}
                    aria-label={`Move ${SECTION_LABEL[section.key]} up`}
                    className="grid h-11 w-11 place-items-center rounded-control border border-hairline bg-paper text-ink transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  </button>
                </form>

                <form action={reorderSection}>
                  <input type="hidden" name="key" value={section.key} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={!canEdit || last}
                    aria-label={`Move ${SECTION_LABEL[section.key]} down`}
                    className="grid h-11 w-11 place-items-center rounded-control border border-hairline bg-paper text-ink transition-transform duration-200 hover:translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                </form>

                <form action={toggleSection}>
                  <input type="hidden" name="key" value={section.key} />
                  <input type="hidden" name="visible" value={section.visible ? '0' : '1'} />
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="h-11 rounded-control border border-hairline bg-paper px-3 text-xs font-medium text-ink disabled:opacity-40"
                  >
                    {section.visible ? 'Hide' : 'Show'}
                  </button>
                </form>
              </div>
            </div>

            <details className="group mt-3 rounded-control border border-hairline bg-canvas/60 px-3 py-2">
              <summary className="cursor-pointer list-none text-xs font-medium text-forest marker:hidden">
                Customise this section
              </summary>

              <div className="mt-3 space-y-4">
                <form action={saveSectionHeading} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="key" value={section.key} />
                  <label className="min-w-0 flex-1" htmlFor={`heading-${section.key}`}>
                    <span className="text-xs text-ink-muted">Heading</span>
                    <input
                      id={`heading-${section.key}`}
                      name="heading"
                      defaultValue={section.heading ?? ''}
                      maxLength={80}
                      placeholder="Leave empty for the default wording"
                      disabled={!canEdit}
                      className="mt-1 h-11 w-full rounded-control border border-hairline bg-paper px-3 text-sm text-ink disabled:opacity-60"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="btn btn-sm btn-outline h-11 disabled:opacity-40"
                  >
                    Save heading
                  </button>
                </form>

                {section.key === 'hero' ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <form action={uploadSectionImage} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="key" value="hero" />
                      <label className="min-w-0">
                        <span className="text-xs text-ink-muted">Opening photograph</span>
                        <input
                          type="file"
                          name="image"
                          accept="image/webp,image/jpeg,image/png"
                          disabled={!canEdit || !storageReady}
                          className="mt-1 block w-full text-xs text-ink-muted file:mr-3 file:rounded-control file:border file:border-hairline file:bg-paper file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink disabled:opacity-60"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={!canEdit || !storageReady}
                        className="btn btn-sm btn-primary h-11 disabled:opacity-40"
                      >
                        Upload
                      </button>
                    </form>

                    {section.imagePath ? (
                      <form action={clearSectionImage}>
                        <input type="hidden" name="key" value="hero" />
                        <button
                          type="submit"
                          disabled={!canEdit}
                          className="h-11 rounded-control border border-hairline bg-paper px-3 text-xs text-ink-muted disabled:opacity-40"
                        >
                          Remove photo
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}

                {!storageReady && section.key === 'hero' ? (
                  <p className="text-xs text-ink-muted">
                    Photo storage is not configured for this environment, so uploads are off.
                  </p>
                ) : null}
              </div>
            </details>
          </li>
        )
      })}
    </ol>
  )
}
