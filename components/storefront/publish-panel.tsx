import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublishState, VersionSummary } from '@/lib/db/storefronts'
import { shortDate } from '@/lib/utils'
import { publishPage, restorePageVersion } from '@/app/(app)/storefront/actions'

interface Props {
  state: PublishState
  versions: VersionSummary[]
  canEdit: boolean
  labels: {
    title: string
    body: string
    hasChanges: string
    upToDate: string
    neverPublished: string
    action: string
    republish: string
    history: string
    live: string
    restore: string
    empty: string
    version: string
    restoreHint: string
  }
}

/**
 * Publishing sits above the editor, not beside it, because the owner's question
 * is "what do my clients see right now?" — and the answer is a version number.
 *
 * Server-rendered forms only: a publish is a state change that must survive a
 * dropped connection, so it is a POST, not a client-side mutation.
 */
export function PublishPanel({ state, versions, canEdit, labels }: Props) {
  const never = state.publishedVersion === null
  const tone = never ? 'warning' : state.hasUnpublishedChanges ? 'gold' : 'success'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{labels.title}</CardTitle>
          <Badge tone={tone as 'warning' | 'gold' | 'success'}>
            {never
              ? labels.neverPublished
              : state.hasUnpublishedChanges
                ? labels.hasChanges
                : labels.upToDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-muted">{labels.body}</p>

        <form action={publishPage} className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canEdit}
            className="btn btn-sm btn-primary h-11 disabled:opacity-40"
          >
            {never ? labels.action : labels.republish}
          </button>
          {state.publishedVersion !== null ? (
            <span className="text-xs text-ink-muted">
              {labels.version.replace('{n}', String(state.publishedVersion))}
              {state.publishedAt ? ` · ${shortDate(state.publishedAt)}` : ''}
            </span>
          ) : null}
        </form>

        <div className="border-t border-hairline pt-4">
          <p className="mb-2 text-xs text-ink-muted">{labels.history}</p>
          {versions.length === 0 ? (
            <p className="text-xs text-ink-muted">{labels.empty}</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-hairline bg-paper px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    {labels.version.replace('{n}', String(version.version))}
                    <span className="text-xs text-ink-muted">{shortDate(version.createdAt)}</span>
                    {version.isLive ? <Badge tone="success">{labels.live}</Badge> : null}
                  </span>
                  {version.isLive ? null : (
                    <form action={restorePageVersion}>
                      <input type="hidden" name="versionId" value={version.id} />
                      <button
                        type="submit"
                        disabled={!canEdit}
                        className="h-11 rounded-control border border-hairline bg-canvas px-3 text-xs font-medium text-ink disabled:opacity-40"
                      >
                        {labels.restore}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-ink-muted">{labels.restoreHint}</p>
        </div>
      </CardContent>
    </Card>
  )
}
