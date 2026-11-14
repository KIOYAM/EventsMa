import { PageHeader } from '@/components/ui/page-header'
import { QuoteComposer } from '@/components/quote/composer'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getComposerData } from '@/lib/db/queries'
import { createTranslator } from '@/lib/i18n'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('quotes.new.title') }
}

export default async function NewQuotePage() {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const data = await withWorkspace(ctx, () => getComposerData(ctx.orgId, ctx.demo))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('quotes.new.eyebrow')}
        title={t('quotes.new.heading')}
        description={t('quotes.new.description')}
      />
      <QuoteComposer
        demo={data.demo}
        services={data.services}
        items={data.items}
        clients={data.clients}
        locale={locale}
      />
    </div>
  )
}
