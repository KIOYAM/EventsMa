import { and, asc, eq, sql } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { inventoryItems, inventoryMovements } from '@/lib/db/schema'
import { formatINR } from '@/lib/domain/money'
import { createInventoryItem, recordInventoryMovement } from './actions'

export const metadata = { title: 'Inventory' }

const ERROR_COPY: Record<string, string> = {
  invalid: 'Check the name and quantities — they must be numbers.',
  permission: 'Only an owner or manager can change stock.',
  missing: 'That item no longer exists.',
  demo: 'Demo mode: connect a database before recording stock.',
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
  const params = await searchParams
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const rows: StockRow[] = ctx.demo
    ? DEMO_ROWS
    : await getDb()
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
        .orderBy(asc(inventoryItems.name))

  const low = rows.filter((row) => row.reorderLevelMilli > 0 && row.onHandMilli <= row.reorderLevelMilli)
  const stockValuePaise = rows.reduce(
    (total, row) => total + Math.round(((row.costPaisePerUnit ?? 0) * row.onHandMilli) / 1000),
    0,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Stock that reconciles, because it is only ever a sum"
        description="There is no editable on-hand number. Every receipt, issue and wastage is an append-only movement; a mistake is fixed with a reversing entry."
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">Saved.</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">Items tracked</p>
            <p className="tabular text-2xl font-semibold text-ink">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">Below reorder level</p>
            <p className="tabular text-2xl font-semibold text-ink">{low.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">Stock value at cost</p>
            <p className="tabular text-2xl font-semibold text-ink">{formatINR(stockValuePaise)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-x-auto rounded-card border border-hairline bg-paper">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 text-right font-medium">On hand</th>
                <th className="px-4 py-3 text-right font-medium">Reorder at</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-ink-muted">
                    No stock items yet. Add rice, oil or gas to start the ledger.
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
                          {row.supplier ?? 'No supplier set'}
                          {row.costPaisePerUnit != null ? ` · ${formatINR(row.costPaisePerUnit)}/${row.unit}` : ''}
                        </p>
                      </td>
                      <td className="tabular px-4 py-3 text-right text-ink">
                        {qty(row.onHandMilli)} {row.unit}
                        {isLow ? (
                          <span className="mt-1 block">
                            <Badge tone="warning">Low</Badge>
                          </span>
                        ) : null}
                      </td>
                      <td className="tabular px-4 py-3 text-right text-xs text-ink-muted">
                        {row.reorderLevelMilli > 0 ? `${qty(row.reorderLevelMilli)} ${row.unit}` : '—'}
                      </td>
                      <td className="tabular px-4 py-3 text-right text-ink">
                        {formatINR(Math.round(((row.costPaisePerUnit ?? 0) * row.onHandMilli) / 1000))}
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
              <CardTitle>Record a movement</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={recordInventoryMovement} className="space-y-3">
                <Field label="Item" htmlFor="movementItem">
                  <Select id="movementItem" name="itemId" required defaultValue="">
                    <option value="" disabled>
                      Choose
                    </option>
                    {rows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quantity" htmlFor="movementQty" hint="In the item unit.">
                    <Input id="movementQty" name="quantity" inputMode="decimal" required placeholder="25" />
                  </Field>
                  <Field label="Reason" htmlFor="movementReason">
                    <Select id="movementReason" name="reason" defaultValue="purchase">
                      {REASONS.map((reason) => (
                        <option key={reason.key} value={reason.key}>
                          {reason.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Note" htmlFor="movementNote">
                  <Input id="movementNote" name="note" maxLength={240} placeholder="Invoice 4821, Balaji Stores" />
                </Field>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
                >
                  Record movement
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add an item</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createInventoryItem} className="space-y-3">
                <Field label="Item" htmlFor="itemName">
                  <Input id="itemName" name="name" required maxLength={120} placeholder="Sona masoori rice" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Unit" htmlFor="itemUnit">
                    <Select id="itemUnit" name="unit" defaultValue="kg">
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Opening stock" htmlFor="itemOpening">
                    <Input id="itemOpening" name="opening" inputMode="decimal" placeholder="0" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reorder at" htmlFor="itemReorder">
                    <Input id="itemReorder" name="reorder" inputMode="decimal" placeholder="25" />
                  </Field>
                  <Field label="Cost / unit (₹)" htmlFor="itemCost">
                    <Input id="itemCost" name="cost" inputMode="decimal" placeholder="72" />
                  </Field>
                </div>
                <Field label="Supplier" htmlFor="itemSupplier">
                  <Input id="itemSupplier" name="supplier" maxLength={120} placeholder="Balaji Stores" />
                </Field>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
                >
                  Add item
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

      <p className="text-[11px] text-ink-muted">
        Stock is not yet deducted automatically when a quotation is sent. The prep sheet will do that once event
        sessions exist — until then, record consumption manually.
      </p>
    </div>
  )
}
