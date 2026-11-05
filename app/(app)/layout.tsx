import { AppShell } from '@/components/app-shell'
import { requireWorkspace } from '@/lib/auth/session'
import { getEnabledVerticals } from '@/lib/db/catering'
import { getBusinessIdentity } from '@/lib/db/identity'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspace()
  const [business, verticals] = await Promise.all([
    getBusinessIdentity(ctx.orgId, ctx.demo),
    getEnabledVerticals(ctx.orgId, ctx.demo),
  ])

  return (
    <AppShell
      businessName={business.name}
      demo={ctx.demo}
      email={ctx.demo ? null : ctx.email}
      verticals={verticals}
    >
      {children}
    </AppShell>
  )
}
