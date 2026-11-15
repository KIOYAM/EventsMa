import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, FileText, IndianRupee, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/surface'
import { Stat } from '@/components/ui/stat'
import { AttentionList } from '@/components/dashboard/attention-list'
import { PageHeader } from '@/components/ui/page-header'
import { StatSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { requireWorkspace, type WorkspaceContext } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getAttentionItems } from '@/lib/db/attention'
import { getWorkspaceSummary } from '@/lib/db/queries'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised, relativeDaysLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('dashboard.title') }
}

type StatusTone = 'success' | 'mint' | 'gold' | 'accent' | 'neutral'

const STATUS_TONE: Record<string, StatusTone> = {
  accepted: 'success',
  sent: 'mint',
  draft: 'neutral',
  viewed: 'gold',
  declined: 'accent',
}

function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? 'neutral'
}

/** "dish" → "dishes", "decor element" → "decor elements". */
function pluralItem(noun: string, count: number): string {
  if (count === 1) return noun
  if (/(s|sh|ch|x|z)$/.test(noun)) return `${noun}es`
  if (/[^aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`
  return `${noun}s`
}

/**
 * Catalogue nouns are the descriptor's data, so the count sentence picks a
 * catalogue noun by that exact string and falls back to the descriptor's own
 * pluralisation for a vertical the platform has never seen.
 */
const NOUN_KEYS: Record<string, [one: string, many: string]> = {
  dish: ['dashboard.nouns.dish', 'dashboard.nouns.dishes'],
  'decor element': ['dashboard.nouns.decorElement', 'dashboard.nouns.decorElements'],
  'coverage item': ['dashboard.nouns.coverageItem', 'dashboard.nouns.coverageItems'],
  'makeup package': ['dashboard.nouns.makeupPackage', 'dashboard.nouns.makeupPackages'],
  'catalogue item': ['dashboard.nouns.catalogueItem', 'dashboard.nouns.catalogueItems'],
  'service package': ['dashboard.nouns.servicePackage', 'dashboard.nouns.servicePackages'],
  asset: ['dashboard.nouns.asset', 'dashboard.nouns.assets'],
}

function itemCount(
  t: (key: string, vars?: Record<string, string | number>) => string,
  noun: string,
  count: number,
): string {
  const keys = NOUN_KEYS[noun]
  const translated = keys ? t(count === 1 ? keys[0] : keys[1]) : pluralItem(noun, count)
  return t('dashboard.services.itemCount', { count, noun: translated })
}

export default async function DashboardPage() {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('dashboard.eyebrow')}
        title={t('dashboard.heading')}
        description={t('dashboard.intro')}
        actions={
          <LinkButton href="/quotes/new">
            {t('dashboard.newQuote')}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        }
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody ctx={ctx} locale={locale} />
      </Suspense>
    </div>
  )
}

async function DashboardBody({ ctx, locale }: { ctx: WorkspaceContext; locale: Locale }) {
  const t = createTranslator(locale)
  const [data, attention] = await withWorkspace(ctx, () =>
    Promise.all([
      getWorkspaceSummary(ctx.orgId, ctx.demo),
      getAttentionItems(ctx.orgId, ctx.demo),
    ]),
  )
  const activeServices = data.services.filter((s) => s.enabled)
  const [noteBefore, noteAfter = ''] = t('dashboard.demoNote').split('{file}')

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t('dashboard.stats.pipeline')}
          value={formatINR(data.stats.pipelinePaise, { compact: true })}
          hint={t('dashboard.stats.pipelineHint')}
          icon={<IndianRupee className="h-4 w-4" aria-hidden />}
          emphasis="hero"
        />
        <Stat
          label={t('dashboard.stats.awaiting')}
          value={String(data.stats.sentCount)}
          hint={t('dashboard.stats.awaitingHint')}
          icon={<FileText className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label={t('dashboard.stats.upcoming')}
          value={String(data.stats.upcomingCount)}
          hint={t('dashboard.stats.upcomingHint')}
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label={t('dashboard.stats.margin')}
          value={formatPercentBp(data.stats.marginBp)}
          hint={t('dashboard.stats.marginHint')}
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title={t('dashboard.attention.heading')}
          hint={t('dashboard.attention.intro')}
        />
        <AttentionList items={attention} locale={locale} />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title={t('dashboard.services.heading')}
          hint={t('dashboard.services.intro')}
          action={
            <Link href="/services" className="text-forest underline-offset-4 hover:underline">
              {t('dashboard.services.manage')}
            </Link>
          }
        />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {activeServices.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-4 text-sm text-ink-muted">
                {t('dashboard.services.empty')}
              </CardContent>
            </Card>
          ) : (
            activeServices.map((service) => {
              const descriptor = verticalDescriptor(service.verticalKey)
              return (
                <div
                  key={service.verticalKey}
                  className="min-w-[168px] card-surface p-4"
                >
                  <p className="text-sm font-medium text-ink">{descriptor.label}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {itemCount(t, descriptor.itemNoun, service.itemCount)}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="space-y-3">
                <SectionHeader
          title={t('dashboard.quotes.heading')}
          hint={t('dashboard.quotes.intro')}
          action={
            <Link href="/quotes" className="text-forest underline-offset-4 hover:underline">
              {t('dashboard.quotes.all')}
            </Link>
          }
        />

        {data.quotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 p-6">
              <p className="text-sm font-medium text-ink">{t('dashboard.quotes.emptyTitle')}</p>
              <p className="text-sm text-ink-muted">{t('dashboard.quotes.emptyBody')}</p>
              <LinkButton href="/quotes/new" size="sm" className="mt-1">
                {t('dashboard.quotes.emptyAction')}
              </LinkButton>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden card-surface">
            {data.quotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-4 py-3.5 last:border-b-0 hover:bg-mint-subtle/60 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{quote.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {t('dashboard.quotes.line', {
                      number: quote.number,
                      date: formatDateLocalised(quote.eventDate, locale, 'short', 'numeric'),
                      relative: relativeDaysLocalised(quote.eventDate, locale),
                      guests: quote.guests,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-medium text-ink">
                    {formatPaiseLocalised(quote.totalPaise, locale)}
                  </span>
                  <Badge tone={statusTone(quote.status)}>{quote.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {data.demo ? (
        <p className="text-xs text-ink-muted">
          {noteBefore}
          <code>.env.local</code>
          {noteAfter}
        </p>
      ) : null}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={4} />
    </div>
  )
}
