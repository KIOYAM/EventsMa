import { AppShell } from '@/components/app-shell'
import { requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEnabledServices } from '@/lib/db/queries'
import { getBusinessIdentity } from '@/lib/db/identity'
import { getLocale } from '@/lib/i18n/server'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspace()
  // The workspace is already dynamic (auth + cookies), so reading the interface
  // language here cannot de-prerender a public page. The root layout stays static.
  const locale = await getLocale()
  const [business, enabledServices] = await withWorkspace(ctx, () =>
    Promise.all([getBusinessIdentity(ctx.orgId, ctx.demo), getEnabledServices(ctx.orgId, ctx.demo)]),
  )

  return (
    <AppShell
      businessName={business.name}
      demo={ctx.demo}
      email={ctx.demo ? null : ctx.email}
      enabledServices={enabledServices}
      locale={locale}
    >
      {children}
    </AppShell>
  )
}
