import { AppShell } from '@/components/app-shell'
import { requireWorkspace } from '@/lib/auth/session'
import { getEnabledServices } from '@/lib/db/queries'
import { getBusinessIdentity } from '@/lib/db/identity'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspace()
  const [business, enabledServices] = await Promise.all([
    getBusinessIdentity(ctx.orgId, ctx.demo),
    getEnabledServices(ctx.orgId, ctx.demo),
  ])

  return (
    <AppShell
      businessName={business.name}
      demo={ctx.demo}
      email={ctx.demo ? null : ctx.email}
      enabledServices={enabledServices}
    >
      {children}
    </AppShell>
  )
}
