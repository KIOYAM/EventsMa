import Link from 'next/link'
import { History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getAuditEntityCounts, getAuditEvents } from '@/lib/db/audit'
import { withWorkspace } from '@/lib/db/workspace'
import {
  auditEntityHref,
  auditFields,
  humaniseAction,
  isAuditEntity,
} from '@/lib/domain/audit'
import { createTranslator } from '@/lib/i18n'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { cn, shortDate } from '@/lib/utils'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('audit.heading') }
}

/**
 * Only the actions the platform writes today. Anything newer falls back to the
 * stored string, so a writer that lands before its label is still readable.
 */
const ACTION_KEYS: Record<string, string> = {
  'invoice.created': 'audit.action.invoiceCreated',
  'invoice.marked_paid': 'audit.action.invoiceMarkedPaid',
  'invoice.voided': 'audit.action.invoiceVoided',
  'payment.recorded': 'audit.action.paymentRecorded',
  'quote.accepted': 'audit.action.quoteAccepted',
  'team.invitation_accepted': 'audit.action.invitationAccepted',
}

const ENTITY_TONE: Record<string, 'mint' | 'gold' | 'success' | 'neutral'> = {
  invoice: 'mint',
  quotation: 'gold',
  invitation: 'neutral',
  payment: 'success',
}

const chipClass = (active: boolean) =>
  cn(
    'inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-xs transition-colors',
    active
      ? 'border-forest bg-mint font-medium text-forest'
      : 'border-hairline text-ink-muted hover:bg-mint-subtle hover:text-ink',
  )

/** A missing catalogue key returns the key itself, so a fallback is explicit. */
function labelFor(
  t: ReturnType<typeof createTranslator>,
  key: string,
  fallback: string,
): string {
  const value = t(key)
  return value === key ? fallback : value
}

function parseCursor(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Date and time together: "what happened when" is the whole point of the page. */
function timestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(date)
  return `${shortDate(date)} · ${time}`
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; before?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams

  const entity = isAuditEntity(params.entity) ? params.entity : undefined
  const cursor = parseCursor(params.before)
  const canRead = canManageCommercial(ctx.role)

  // RLS also refuses an employee this read; checking the role first means they
  // get a sentence instead of an empty page that looks like a broken log.
  const data = canRead
    ? await withWorkspace(ctx, async () => {
        const [page, counts] = await Promise.all([
          getAuditEvents(ctx.orgId, ctx.demo, { entity, before: cursor }),
          getAuditEntityCounts(ctx.orgId, ctx.demo),
        ])
        return { page, counts }
      })
    : null

  const total = data?.counts.reduce((sum, row) => sum + row.count, 0) ?? 0
  const last = data?.page.rows[data.page.rows.length - 1]
  const olderHref =
    data?.page.hasMore && last
      ? `/audit?before=${encodeURIComponent(last.createdAt)}${entity ? `&entity=${entity}` : ''}`
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('audit.eyebrow')}
        title={t('audit.heading')}
        description={t('audit.intro')}
      />

      {!data ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<History className="h-6 w-6" aria-hidden />}
              title={t('audit.permissionTitle')}
              description={t('audit.permissionBody')}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Link href="/audit" aria-current={!entity ? 'page' : undefined} className={chipClass(!entity)}>
              {t('audit.all')}
              <span className="tabular-nums opacity-60">{total}</span>
            </Link>
            {data.counts.map((row) => (
              <Link
                key={row.entity}
                href={`/audit?entity=${encodeURIComponent(row.entity)}`}
                aria-current={entity === row.entity ? 'page' : undefined}
                className={chipClass(entity === row.entity)}
              >
                {labelFor(t, `audit.entity.${row.entity}`, humaniseAction(row.entity))}
                <span className="tabular-nums opacity-60">{row.count}</span>
              </Link>
            ))}
          </div>

          {data.page.rows.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={<History className="h-6 w-6" aria-hidden />}
                  title={entity ? t('audit.filteredEmptyTitle') : t('audit.emptyTitle')}
                  description={entity ? t('audit.filteredEmptyBody') : t('audit.emptyBody')}
                  action={
                    entity ? (
                      <Link href="/audit" className="btn btn-sm btn-outline">
                        {t('audit.all')}
                      </Link>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <ol className="space-y-2">
              {data.page.rows.map((row) => {
                const fields = auditFields(row.after)
                const href = auditEntityHref(row.entity, row.entityId)
                const actionKey = ACTION_KEYS[row.action]
                return (
                  <li key={row.id} className="card-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {actionKey
                            ? labelFor(t, actionKey, humaniseAction(row.action))
                            : humaniseAction(row.action)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {t('audit.by')} {row.actorName ?? t('audit.system')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={ENTITY_TONE[row.entity] ?? 'outline'}>
                          {labelFor(t, `audit.entity.${row.entity}`, humaniseAction(row.entity))}
                        </Badge>
                        <span className="text-xs text-ink-muted tabular-nums">
                          {timestamp(row.createdAt)}
                        </span>
                      </div>
                    </div>

                    {fields.length > 0 ? (
                      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                        {fields.map((field) => (
                          <div key={field.key} className="flex min-w-0 gap-1.5">
                            <dt className="shrink-0 text-ink-muted">{field.label}</dt>
                            <dd className="min-w-0 truncate text-ink tabular-nums">{field.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}

                    {href ? (
                      <Link
                        href={href}
                        className="mt-3 inline-block text-xs font-medium text-forest underline underline-offset-4"
                      >
                        {t('audit.open')}
                      </Link>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              {t('audit.count', { count: data.page.rows.length })}
            </p>
            {olderHref ? (
              <Link href={olderHref} className="btn btn-sm btn-outline">
                {t('audit.older')}
              </Link>
            ) : cursor ? (
              <Link href={entity ? `/audit?entity=${encodeURIComponent(entity)}` : '/audit'} className="btn btn-sm btn-outline">
                {t('audit.newest')}
              </Link>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
