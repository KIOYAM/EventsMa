import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareLinks, type ShareLabels } from './share-links'

interface Props {
  url: string | null
  message: string
  labels: ShareLabels & { title: string; body: string; unavailable: string }
}

/**
 * The draft, in a link the owner can send before publishing.
 *
 * Deliberately separate from the published share strip: this one hands over an
 * unfinished page, so the copy says so and the link carries an expiry rather than
 * pretending to be public.
 */
export function PreviewLinkCard({ url, message, labels }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-ink-muted">{labels.body}</p>
        {url ? (
          <ShareLinks url={url} message={message} labels={labels} />
        ) : (
          <p className="text-sm text-ink-muted">{labels.unavailable}</p>
        )}
      </CardContent>
    </Card>
  )
}
