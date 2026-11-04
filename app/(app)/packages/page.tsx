import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getPackages } from '@/lib/db/packages'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { UNIT_CLASSES, unitClassLabel } from '@/lib/domain/units'
import { VERTICAL_CATALOG, verticalDescriptor } from '@/lib/domain/verticals'
import { createPackage, togglePackage } from './actions'

export const metadata = { title: 'Packages' }

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can change packages.',
  demo: 'Demo mode: connect a database before adding a package.',
  invalid: 'Check the name, service, unit and rate.',
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const packages = await getPackages(ctx.orgId, ctx.demo)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Sell the package, not fourteen separate dishes"
        description="A package carries a rate, a minimum quantity and what it includes. The minimum is enforced by the quote engine, so a 100-guest package cannot silently become a 30-guest discount."
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Saved.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          {packages.length === 0 ? (
            <EmptyState
              title="No packages yet"
              description="Start with the one you sell most often: the veg banquet, the stage decor bundle or a full-day coverage package."
            />
          ) : (
            packages.map((row) => (
              <article key={row.id} className="rounded-card border border-hairline bg-paper p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-ink">{row.name}</h2>
                      <Badge tone="outline">{verticalDescriptor(row.verticalKey).label}</Badge>
                      {!row.active ? <Badge tone="neutral">Inactive</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatINR(row.ratePaise)} · {unitClassLabel(row.unitClass)} · minimum{' '}
                      {row.minQuantity || 1} · tax {formatPercentBp(row.taxRateBp)}
                    </p>
                    {row.inclusions.length > 0 ? (
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                        Includes: {row.inclusions.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <form action={togglePackage}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="active" value={row.active ? '0' : '1'} />
                    <button
                      type="submit"
                      disabled={!canEdit}
                      className="text-xs text-ink-muted underline underline-offset-2 disabled:opacity-40"
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Add a package</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPackage} className="space-y-4">
              <Field label="Package name" htmlFor="name">
                <Input id="name" name="name" required maxLength={120} placeholder="Veg banquet — 7 items" />
              </Field>
              <Field label="Service" htmlFor="verticalKey">
                <Select id="verticalKey" name="verticalKey" defaultValue="catering">
                  {VERTICAL_CATALOG.map((vertical) => (
                    <option key={vertical.key} value={vertical.key}>
                      {vertical.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Billing unit" htmlFor="unitClass">
                  <Select id="unitClass" name="unitClass" defaultValue="PER_GUEST">
                    {UNIT_CLASSES.map((unit) => (
                      <option key={unit.key} value={unit.key}>
                        {unit.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Rate (₹)" htmlFor="rate">
                  <Input id="rate" name="rate" inputMode="decimal" required placeholder="850" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Minimum quantity" htmlFor="minQuantity" hint="Guests, units or days.">
                  <Input id="minQuantity" name="minQuantity" inputMode="numeric" defaultValue={100} />
                </Field>
                <Field label="Tax %" htmlFor="taxPercent">
                  <Input id="taxPercent" name="taxPercent" inputMode="decimal" defaultValue={5} />
                </Field>
              </div>
              <Field label="Inclusions" htmlFor="inclusions" hint="One per line or comma separated.">
                <Textarea
                  id="inclusions"
                  name="inclusions"
                  className="min-h-20"
                  placeholder="Welcome drink, two starters, three mains, payasam"
                />
              </Field>
              <button
                type="submit"
                disabled={!canEdit}
                className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                Add package
              </button>
              {!canEdit ? (
                <p className="text-xs text-ink-muted">
                  {ctx.demo ? 'Demo mode is read-only.' : 'Owner or manager only.'}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
