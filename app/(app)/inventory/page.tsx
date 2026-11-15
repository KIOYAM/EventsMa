import { and, asc, eq, sql } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { withWorkspace } from '@/lib/db/workspace'
import { inventoryItems, inventoryMovements } from '@/lib/db/schema'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { createInventoryItem, recordInventoryMovement } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('inventory.title') }
}

const ERROR_KEYS: Record<string, string> = {
  invalid: 'inventory.errors.invalid',
  permission: 'inventory.errors.permission',
  missing: 'inventory.errors.missing',
  demo: 'inventory.errors.demo',
}

const UNITS = ['kg', 'ltr', 'pcs', 'dozen', 'pack'] as const
const REASONS = [
  { key: 'purchase', label: 'Purchase received' },
  { key: 'consumption', label: 'Used in an event' },
  { key: 'wastage', label: 'Wastage' },
  { key: 'correction', label: 'Correction (signed)' },
] as const

type StockRow = {
  id: string
  name: string
  unit: string
  reorderLevelMilli: number
  costPaisePerUnit: number | null
  supplier: string | null
  onHandMilli: number
}

const DEMO_ROWS: StockRow[] = [
  { id: 'demo-1', name: 'Sona masoori rice', unit: 'kg', reorderLevelMilli: 50_000, costPaisePerUnit: 7200, supplier: 'Sri Balaji Stores', onHandMilli: 120_000 },
  { id: 'demo-2', name: 'Toor dal', unit: 'kg', reorderLevelMilli: 25_000, costPaisePerUnit: 14_000, supplier: 'Sri Balaji Stores', onHandMilli: 18_000 },
  { id: 'demo-3', name: 'Cooking oil', unit: 'ltr', reorderLevelMilli: 20_000, costPaisePerUnit: 13_500, supplier: 'Vijay Wholesale', onHandMilli: 42_000 },
  { id: 'demo-4', name: 'Banana leaves', unit: 'pack', reorderLevelMilli: 10_000, costPaisePerUnit: 55_000, supplier: null, onHandMilli: 6_000 },
]

const qty = (milli: number) => (milli / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 })

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const params = await searchParams
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const rows: StockRow[] = ctx.demo
    ? DEMO_ROWS
    : await withWorkspace(ctx, () =>
        getDb()
          .select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            unit: inventoryItems.unit,
            reorderLevelMilli: inventoryItems.reorderLevelMilli,
            costPaisePerUnit: inventoryItems.costPaisePerUnit,
            supplier: inventoryItems.supplier,
            onHandMilli: sql<number>`coalesce(sum(${inventoryMovements.deltaMilli}), 0)::int`,
          })
          .from(inventoryItems)
          .leftJoin(inventoryMovements, eq(inventoryMovements.itemId, inventoryItems.id))
          .where(and(eq(inventoryItems.orgId, ctx.orgId), eq(inventoryItems.active, true)))
          .groupBy(inventoryItems.id)
          .orderBy(asc(inventoryItems.name)),
      )

  const low = rows.filter((row) => row.reorderLevelMilli > 0 && row.onHandMilli <= row.reorderLevelMilli)
  const stockValuePaise = rows.reduce(
    (total, row) => total + Math.round(((row.costPaisePerUnit ?? 0) * row.onHandMilli) / 1000),
    0,
  )

  const errorKey = params.error ? ERROR_KEYS[params.error] : undefined
  const savedKey = params.saved === 'movement' ? 'inventory.saved.movement' : params.saved === 'item' ? 'inventory.saved.item' : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('inventory.eyebrow')}
        title={t('inventory.heading')}
        description={t('inventory.intro')}
      />

      {errorKey ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}
      {savedKey ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t(savedKey)}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">{t('inventory.stats.items')}</p>
            <p className="tabular text-2xl font-semibold text-ink">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">{t('inventory.stats.belowReorder')}</p>
            <p className="tabular text-2xl font-semibold text-ink">{low.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">{t('inventory.stats.stockValue')}</p>
            <p className="tabular text-2xl font-semibold text-ink">
              {formatPaiseLocalised(stockValuePaise, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-x-auto card-surface">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">{t('inventory.table.item')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('inventory.table.onHand')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('inventory.table.reorderAt')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('inventory.table.value')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-ink-muted">
                    {t('inventory.empty')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isLow = row.reorderLevelMilli > 0 && row.onHandMilli <= row.reorderLevelMilli
                  return (
                    <tr key={row.id} className="border-b border-hairline last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="text-ink">{row.name}</p>
                        <p className="text-[11px] text-ink-muted">
                          {row.supplier ?? t('inventory.table.noSupplier')}
                          {row.costPaisePerUnit != null ? ` · ${formatPaiseLocalised(row.costPaisePerUnit, locale)}/${row.unit}` : ''}
                        </p>
                      </td>
                      <td className="tabular px-4 py-3 text-right text-ink">
                        {qty(row.onHandMilli)} {row.unit}
                        {isLow ? (
                          <span className="mt-1 block">
                            <Badge tone="warning">{t('inventory.stats.belowReorder')}</Badge>
                          </span>
                        ) : null}
                      </td>
                      <td className="tabular px-4 py-3 text-right text-xs text-ink-muted">
                        {row.reorderLevelMilli > 0 ? `${qty(row.reorderLevelMilli)} ${row.unit}` : '—'}
                      </td>
                      <td className="tabular px-4 py-3 text-right text-ink">
                        {formatPaiseLocalised(Math.round(((row.costPaisePerUnit ?? 0) * row.onHandMilli) / 1000), locale)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.movement.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={recordInventoryMovement} className="space-y-3">
                <Field label={t('inventory.movement.item')} htmlFor="movementItem">
                  <Select id="movementItem" name="itemId" required defaultValue="">
                    <option value="" disabled>
                      {t('inventory.movement.item')}
                    </option>
                    {rows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label={t('inventory.movement.quantity')}
                    htmlFor="movementQty"
                    hint={t('inventory.movement.itemHint')}
                  >
                    <Input id="movementQty" name="quantity" inputMode="decimal" required placeholder={t('inventory.movement.quantityPlaceholder')} />
                  </Field>
                  <Field label={t('inventory.movement.reason')} htmlFor="movementReason">
                    <Select id="movementReason" name="reason" defaultValue="purchase">
                      {REASONS.map((reason) => (
                        <option key={reason.key} value={reason.key}>
                          {reason.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label={t('inventory.movement.note')} htmlFor="movementNote">
                  <Input id="movementNote" name="note" maxLength={240} placeholder={t('inventory.movement.notePlaceholder')} />
                </Field>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="btn btn-md btn-primary w-full disabled:opacity-50"
                >
                  {t('inventory.movement.record')}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.add.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createInventoryItem} className="space-y-3">
                <Field label={t('inventory.add.item')} htmlFor="itemName">
                  <Input id="itemName" name="name" required maxLength={120} placeholder={t('inventory.add.itemPlaceholder')} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('inventory.add.unit')} htmlFor="itemUnit">
                    <Select id="itemUnit" name="unit" defaultValue="kg">
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t('inventory.add.openingStock')} htmlFor="itemOpening">
                    <Input id="itemOpening" name="opening" inputMode="decimal" placeholder={t('inventory.add.openingPlaceholder')} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('inventory.add.reorderAt')} htmlFor="itemReorder">
                    <Input id="itemReorder" name="reorder" inputMode="decimal" placeholder={t('inventory.add.reorderPlaceholder')} />
                  </Field>
                  <Field label={t('inventory.add.costUnit')} htmlFor="itemCost">
                    <Input id="itemCost" name="cost" inputMode="decimal" placeholder={t('inventory.add.costPlaceholder')} />
                  </Field>
                </div>
                <Field label={t('inventory.add.supplier')} htmlFor="itemSupplier">
                  <Input id="itemSupplier" name="supplier" maxLength={120} placeholder={t('inventory.add.supplierPlaceholder')} />
                </Field>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="btn btn-md btn-primary w-full disabled:opacity-50"
                >
                  {t('inventory.add.add')}
                </button>
                {!canEdit ? (
                  <p className="text-xs text-ink-muted">
                    {ctx.demo ? t('inventory.errors.demo') : t('inventory.errors.permission')}
                  </p>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-ink-muted">{t('inventory.note')}</p>
    </div>
  )
}
