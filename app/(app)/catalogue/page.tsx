import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getComposerData } from '@/lib/db/queries'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { UNIT_CLASSES, unitClassLabel } from '@/lib/domain/units'
import { titleCase, verticalDescriptor } from '@/lib/domain/verticals'
import { createCatalogueItem } from './actions'

export const metadata = { title: 'Catalogue' }

const ERROR_COPY: Record<string, string> = {
  invalid: 'Check the name and price — the price must be a number.',
  demo: 'Demo mode: connect a database before adding catalogue items.',
  permission: 'Only an owner or manager can edit the catalogue.',
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const data = await getComposerData(ctx.orgId, ctx.demo)

  const activeService = params.vertical ?? data.services[0]?.verticalKey ?? 'catering'
  const descriptor = verticalDescriptor(activeService)
  const items = data.items.filter((item) => item.verticalKey === activeService)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="What you sell, priced the way you sell it"
        description="Every item carries a typed billing unit. The quote engine multiplies by guests, units, hours or days accordingly — never by guesswork."
      />

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {data.services.map((service) => {
          const isActive = service.verticalKey === activeService
          return (
            <Link
              key={service.verticalKey}
              href={`/catalogue?vertical=${encodeURIComponent(service.verticalKey)}`}
              className={
                isActive
                  ? 'whitespace-nowrap rounded-full bg-forest px-4 py-2 text-sm font-medium text-white'
                  : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-4 py-2 text-sm text-ink-muted'
              }
            >
              {verticalDescriptor(service.verticalKey).label}
            </Link>
          )
        })}
      </div>

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">{descriptor.label}</h2>
              <p className="text-xs text-ink-muted">
                {items.length} {descriptor.itemNoun}
                {items.length === 1 ? '' : 's'} · default tax {formatPercentBp(descriptor.defaultTaxRateBp)}
              </p>
            </div>
            <Badge tone="outline">{titleCase(descriptor.defaultUnitClass)}</Badge>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title={`No ${descriptor.itemNoun} yet`}
              description={`Add the first ${descriptor.itemNoun} with a price and a billing unit. It becomes available in the quote composer immediately.`}
            />
          ) : (
            <div className="overflow-hidden rounded-card border border-hairline bg-paper">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {unitClassLabel(item.unitClass)} · tax {formatPercentBp(item.taxRateBp)}
                      {item.costPaise != null
                        ? ` · cost ${formatINR(item.costPaise)}`
                        : ' · cost not set'}
                    </p>
                  </div>
                  <p className="tabular text-sm font-medium text-ink">
                    {formatINR(item.pricePaise)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Add a {descriptor.itemNoun}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCatalogueItem} className="space-y-4">
              <input type="hidden" name="verticalKey" value={activeService} />

              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" required maxLength={160} placeholder="Traditional vegetarian meal" />
              </Field>

              <Field label="Billing unit" htmlFor="unitClass" hint="Typed, so the maths cannot drift.">
                <Select id="unitClass" name="unitClass" defaultValue={descriptor.defaultUnitClass}>
                  {UNIT_CLASSES.map((unit) => (
                    <option key={unit.key} value={unit.key}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₹)" htmlFor="price">
                  <Input id="price" name="price" inputMode="decimal" required placeholder="450" />
                </Field>
                <Field label="Cost (₹)" htmlFor="cost" hint="Enables margin.">
                  <Input id="cost" name="cost" inputMode="decimal" placeholder="300" />
                </Field>
              </div>

              <Field label="Tax %" htmlFor="taxPercent">
                <Input
                  id="taxPercent"
                  name="taxPercent"
                  inputMode="decimal"
                  defaultValue={descriptor.defaultTaxRateBp / 100}
                />
              </Field>

              <button
                type="submit"
                disabled={!canEdit}
                className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                Add to catalogue
              </button>
              {!canEdit ? (
                <p className="text-xs text-ink-muted">
                  {ctx.demo
                    ? 'Demo mode is read-only. Connect a database to write.'
                    : 'Owner or manager only.'}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
