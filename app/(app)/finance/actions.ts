'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { events, expenses } from '@/lib/db/schema'
import { parseRupees } from '@/lib/domain/money'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/domain/ops'

const DATE = /^\d{4}-\d{2}-\d{2}$/

export async function addExpense(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/finance?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/finance?error=demo')

  const amount = parseRupees(String(formData.get('amount') ?? ''))
  const categoryRaw = String(formData.get('category') ?? 'other')
  const category: ExpenseCategory =
    EXPENSE_CATEGORIES.find((candidate) => candidate === categoryRaw) ?? 'other'
  const incurredOn = String(formData.get('incurredOn') ?? '')
  const note = String(formData.get('note') ?? '').trim().slice(0, 240)
  const eventId = String(formData.get('eventId') ?? '').trim()

  if (amount === null || amount <= 0 || !DATE.test(incurredOn)) {
    redirect('/finance?error=amount')
  }

  const db = getDb()
  let linkedEvent: string | null = null
  if (eventId) {
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.orgId, ctx.orgId), eq(events.id, eventId)))
      .limit(1)
    linkedEvent = event?.id ?? null
  }

  await db.insert(expenses).values({
    orgId: ctx.orgId,
    eventId: linkedEvent,
    category,
    amountPaise: amount,
    note: note || null,
    incurredOn,
    createdBy: ctx.userId,
  })

  revalidatePath('/finance')
  revalidatePath('/reports')
  if (linkedEvent) revalidatePath(`/events/${linkedEvent}`)
  redirect('/finance?saved=expense')
}
