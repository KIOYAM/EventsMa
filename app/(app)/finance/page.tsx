import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { Pagination } from '@/components/pagination'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getFinanceData } from '@/lib/db/money'
import { formatINR } from '@/lib/domain/money'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL } from '@/lib/domain/ops'
import { PAGE_SIZE, parsePage } from '@/lib/pagination'
import { shortDate } from '@/lib/utils'
import { addExpense } from './actions'

export const metadata = { title: 'Money' }

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can record an expense.',
  demo: 'Demo mode: connect a database before recording money.',
  amount: 'Enter a positive amount and a valid date.',
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const page = parsePage(params.page)
  const data = await getFinanceData(ctx.orgId, ctx.demo, page)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cash flow"
        title="What came in, what went out"
        description="One ledger over append-only payments and expenses. A mistake is a reversing entry, never an edit, so the month you reported stays the month you can defend."
        actions={
          <Link
            href="/api/exports?kind=ledger"
            className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
            prefetch={false}
          >
            Export CSV
          </Link>
        }
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Expense recorded.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" value={formatINR(data.incomePaise, { compact: true })} hint="Captured payments" tone="positive" />
        <Stat label="Expenses" value={formatINR(data.expensePaise, { compact: true })} hint="Recorded costs" />
        <Stat
          label="Net"
          value={formatINR(data.netPaise, { compact: true })}
          hint={data.netPaise >= 0 ? 'In the black' : 'Spending exceeds receipts'}
          tone={data.netPaise >= 0 ? 'positive' : 'warning'}
        />
        <Stat label="Entries" value={String(data.total)} hint="Across both sources" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Ledger</h2>
          {data.rows.length === 0 ? (
            <EmptyState
              title="No money recorded"
              description="Record a payment against an invoice, or add the first expense. Both feed the reports page immediately."
            />
          ) : (
            <div className="overflow-hidden rounded-card border border-hairline bg-paper">
              {data.rows.map((row) => (
                <div
                  key={`${row.kind}-${row.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{row.label}</p>
                    <p className="text-xs text-ink-muted">
                      {shortDate(row.occurredOn)} · {row.category} · {row.mode}
                    </p>
                  </div>
                  <p
                    className={
                      row.kind === 'payment'
                        ? 'tabular text-sm font-medium text-positive'
                        : 'tabular text-sm font-medium text-ink'
                    }
                  >
                    {row.kind === 'payment' ? '+' : '−'}
                    {formatINR(row.amountPaise)}
                  </p>
                  <Badge tone={row.kind === 'payment' ? 'success' : 'outline'}>
                    {row.kind === 'payment' ? 'In' : 'Out'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <Pagination
            basePath="/finance"
            page={data.page}
            total={data.total}
            pageSize={PAGE_SIZE}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record an expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addExpense} className="space-y-4">
              <Field label="Amount (₹)" htmlFor="expenseAmount">
                <Input id="expenseAmount" name="amount" inputMode="decimal" required placeholder="4200" />
              </Field>
              <Field label="Category" htmlFor="expenseCategory">
                <Select id="expenseCategory" name="category" defaultValue="food">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {EXPENSE_CATEGORY_LABEL[category]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date" htmlFor="incurredOn">
                <Input id="incurredOn" name="incurredOn" type="date" required defaultValue={today} />
              </Field>
              <Field label="Note" htmlFor="expenseNote" hint="What it was for, not who paid.">
                <Textarea id="expenseNote" name="note" className="min-h-20" maxLength={240} />
              </Field>
              <button
                type="submit"
                disabled={!canEdit}
                className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                Add expense
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
