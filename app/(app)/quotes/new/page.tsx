import { PageHeader } from '@/components/ui/page-header'
import { QuoteComposer } from '@/components/quote/composer'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getComposerData, getSubmissionPrefill } from '@/lib/db/queries'
import { createTranslator } from '@/lib/i18n'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('quotes.new.title') }
}

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams

  const [data, prefill] = await withWorkspace(ctx, () =>
    Promise.all([
      getComposerData(ctx.orgId, ctx.demo),
      params.submission
        ? getSubmissionPrefill(ctx.orgId, ctx.demo, params.submission)
        : Promise.resolve(null),
    ]),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('quotes.new.eyebrow')}
        title={prefill ? t('quotes.new.fromSubmissionHeading') : t('quotes.new.heading')}
        description={
          prefill
            ? t('quotes.new.fromSubmissionIntro', {
                client: prefill.title,
                count: prefill.lines.length,
              })
            : t('quotes.new.description')
        }
      />
      <QuoteComposer
        demo={data.demo}
        services={data.services}
        items={data.items}
        clients={data.clients}
        locale={locale}
        prefill={prefill}
      />
    </div>
  )
}
