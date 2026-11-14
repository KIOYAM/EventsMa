'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { shareSubmissions } from '@/lib/db/schema-share'

const STATUSES = ['new', 'reviewed', 'quoted', 'closed'] as const
type Status = (typeof STATUSES)[number]

const isStatus = (value: string): value is Status => STATUSES.some((s) => s === value)

export async function setSubmissionStatus(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/submissions?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/submissions?error=demo')

  const id = String(formData.get('id') ?? '').slice(0, 64)
  const status = String(formData.get('status') ?? '')
  if (!id || !isStatus(status)) redirect('/submissions?error=invalid')

  await getDb()
    .update(shareSubmissions)
    .set({ status })
    .where(and(eq(shareSubmissions.orgId, ctx.orgId), eq(shareSubmissions.id, id)))

  revalidatePath('/submissions')
  redirect(`/submissions?saved=${status}`)
}
