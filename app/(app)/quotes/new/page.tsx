import { PageHeader } from '@/components/ui/page-header'
import { QuoteComposer } from '@/components/quote/composer'
import { requireWorkspace } from '@/lib/auth/session'
import { getComposerData } from '@/lib/db/queries'

export const metadata = { title: 'New quote' }

export default async function NewQuotePage() {
  const ctx = await requireWorkspace()
  const data = await getComposerData(ctx.orgId, ctx.demo)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New quotation"
        title="One event, every service you provide"
        description="Add lines from any enabled service. The preview is instant; the saved total is recomputed on the server and frozen as version 1."
      />
      <QuoteComposer
        demo={data.demo}
        services={data.services}
        items={data.items}
        clients={data.clients}
      />
    </div>
  )
}
