import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StorefrontSeo } from '@/lib/domain/storefront-seo'
import { saveSeo } from '@/app/(app)/storefront/actions'

const FIELD =
  'mt-1 h-11 w-full rounded-control border border-hairline bg-paper px-3 text-sm text-ink disabled:opacity-60'

interface Labels {
  title: string
  body: string
  titleField: string
  titlePlaceholder: string
  descriptionField: string
  descriptionPlaceholder: string
  noindex: string
  noindexHint: string
  save: string
  hint: string
}

/**
 * Search overrides, saved as draft data.
 *
 * The placeholders are the values the page would derive on its own, so an owner
 * who leaves a field empty sees exactly what a visitor would get rather than a
 * blank box with no context.
 */
export function SeoForm({
  seo,
  defaults,
  canEdit,
  labels,
}: {
  seo: StorefrontSeo
  defaults: { title: string; description: string }
  canEdit: boolean
  labels: Labels
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-ink-muted">{labels.body}</p>

        <form action={saveSeo} className="space-y-3">
          <label className="block">
            <span className="text-xs text-ink-muted">{labels.titleField}</span>
            <input
              name="title"
              defaultValue={seo.title ?? ''}
              maxLength={60}
              disabled={!canEdit}
              placeholder={defaults.title}
              className={FIELD}
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-muted">{labels.descriptionField}</span>
            <textarea
              name="description"
              defaultValue={seo.description ?? ''}
              maxLength={160}
              rows={3}
              disabled={!canEdit}
              placeholder={defaults.description}
              className="mt-1 w-full rounded-control border border-hairline bg-paper px-3 py-2 text-sm text-ink disabled:opacity-60"
            />
          </label>

          <label className="flex items-start gap-2 rounded-control border border-hairline bg-canvas/60 p-3">
            <input
              type="checkbox"
              name="noindex"
              value="1"
              defaultChecked={seo.noindex}
              disabled={!canEdit}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block text-sm text-ink">{labels.noindex}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{labels.noindexHint}</span>
            </span>
          </label>

          <button type="submit" disabled={!canEdit} className="btn btn-sm btn-primary h-11 disabled:opacity-40">
            {labels.save}
          </button>
        </form>

        <p className="text-xs text-ink-muted">{labels.hint}</p>
      </CardContent>
    </Card>
  )
}
