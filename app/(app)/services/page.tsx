import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { requireWorkspace, canManageCommercial } from '@/lib/auth/session'
import { getWorkspaceSummary } from '@/lib/db/queries'
import { GENERIC_VERTICAL, VERTICAL_CATALOG, verticalDescriptor } from '@/lib/domain/verticals'
import { unitClassLabel } from '@/lib/domain/units'
import { setServiceEnabled } from './actions'

export const metadata = { title: 'Services' }

export default async function ServicesPage() {
  const ctx = await requireWorkspace()
  const data = await getWorkspaceSummary(ctx.orgId, ctx.demo)
  const enabledKeys = new Set(data.services.filter((s) => s.enabled).map((s) => s.verticalKey))

  // Known verticals plus any custom specialist service this business already enabled.
  const known = new Set(VERTICAL_CATALOG.map((v) => v.key))
  const custom = [...enabledKeys].filter((key) => !known.has(key))
  const cards = [...VERTICAL_CATALOG, ...custom.map((key) => verticalDescriptor(key)), GENERIC_VERTICAL]
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="What you provide"
        title="Choose the services this business offers"
        description="A business can provide one service or many. Each enabled service gets its own catalogue, units, tax rate and package pricing — one quotation can carry all of them."
      />

      {!canEdit ? (
        <div className="rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          {ctx.demo
            ? 'Demo mode: service changes are disabled until a database is connected.'
            : 'Only an owner or manager can change which services are offered.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((descriptor) => {
          const enabled = enabledKeys.has(descriptor.key)
          const itemCount =
            data.services.find((s) => s.verticalKey === descriptor.key)?.itemCount ?? 0
          const isGeneric = descriptor.key === GENERIC_VERTICAL.key

          return (
            <Card key={descriptor.key} className={enabled ? 'border-mint' : undefined}>
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle>{descriptor.label}</CardTitle>
                  <p className="text-xs text-ink-muted">
                    {descriptor.itemNoun} · {descriptor.packageNoun}
                  </p>
                </div>
                <Badge tone={enabled ? 'success' : 'outline'}>{enabled ? 'Enabled' : 'Off'}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {descriptor.allowedUnitClasses.map((unit) => (
                    <span
                      key={unit}
                      className="rounded-full bg-mint-subtle px-2 py-1 text-[11px] text-forest"
                    >
                      {unitClassLabel(unit)}
                    </span>
                  ))}
                </div>

                <dl className="space-y-1.5 text-xs text-ink-muted">
                  {descriptor.configFields.slice(0, 3).map((field) => (
                    <div key={field.key} className="flex justify-between gap-3">
                      <dt>{field.label}</dt>
                      <dd className="text-right text-ink">
                        {data.services.find((s) => s.verticalKey === descriptor.key)?.config[
                          field.key
                        ] ?? 'Not set'}
                      </dd>
                    </div>
                  ))}
                </dl>

                {isGeneric ? (
                  <p className="text-xs text-ink-muted">
                    Any specialist service can be quoted with a fixed, per-unit, hourly or daily
                    rate without a code change.
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted">
                    {enabled ? `${itemCount} active in the catalogue` : 'Not part of this workspace'}
                  </p>
                )}

                <form action={setServiceEnabled}>
                  <input type="hidden" name="verticalKey" value={descriptor.key} />
                  <input type="hidden" name="enable" value={enabled ? '0' : '1'} />
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className={
                      enabled
                        ? 'inline-flex h-10 items-center rounded-control border border-hairline px-3 text-sm text-ink disabled:opacity-50'
                        : 'inline-flex h-10 items-center rounded-control bg-forest px-3 text-sm font-medium text-white disabled:opacity-50'
                    }
                  >
                    {enabled ? 'Turn off' : 'Enable service'}
                  </button>
                </form>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
