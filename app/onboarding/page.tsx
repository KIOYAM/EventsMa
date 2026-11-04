import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { getCurrentUser, hasSupabaseEnv } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { memberships } from '@/lib/db/schema'
import { VERTICAL_CATALOG } from '@/lib/domain/verticals'
import { createWorkspace } from './actions'

export const metadata = { title: 'Set up your workspace' }

const ERROR_COPY: Record<string, string> = {
  offline: 'This deployment has no database configured, so a workspace cannot be created yet.',
  name: 'A business needs a name — two characters at least.',
  service: 'Pick at least one service. You can add more later in Services.',
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const configured = hasSupabaseEnv() && isDatabaseConfigured()
  if (!configured) redirect('/login')

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [existing] = await getDb()
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1)
  if (existing) redirect('/dashboard')

  const params = await searchParams

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-canvas px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-semibold text-white">
          E
        </span>
        <span className="font-display text-lg text-forest">EventsMa</span>
      </div>

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
        Onboarding
      </p>
      <h1 className="mt-2 font-display text-2xl text-forest">Set up your workspace</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
        One organisation, one business profile and an owner membership are created together in a
        single transaction. Signed in as <span className="text-ink">{user.email}</span>.
      </p>

      {params.error && ERROR_COPY[params.error] ? (
        <div className="mt-5 rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}

      <form action={createWorkspace} className="mt-5 space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5">
            <Field
              label="Business name"
              htmlFor="name"
              hint="What customers see on quotes and your public page."
            >
              <Input id="name" name="name" required maxLength={120} placeholder="Kannan Events" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city">
                <Input id="city" name="city" maxLength={80} placeholder="Coimbatore" />
              </Field>
              <Field label="Phone" htmlFor="phone" hint="Shown on quotes as a call-back number.">
                <Input id="phone" name="phone" maxLength={24} placeholder="+91 98420 11452" />
              </Field>
            </div>
          </CardContent>
        </Card>

        <fieldset className="rounded-card border border-hairline bg-paper p-5">
          <legend className="px-1 text-sm font-semibold text-ink">Services you provide</legend>
          <p className="mt-1 text-xs text-ink-muted">
            Each service gets its own catalogue, units and tax treatment. Pick what you sell — you
            can change this later.
          </p>
          <div className="mt-3 space-y-2">
            {VERTICAL_CATALOG.map((vertical) => (
              <label
                key={vertical.key}
                className="flex cursor-pointer items-start gap-3 rounded-control border border-hairline px-3 py-2.5 text-sm text-ink hover:bg-mint-subtle/50"
              >
                <input
                  type="checkbox"
                  name="vertical"
                  value={vertical.key}
                  defaultChecked={vertical.key === 'catering'}
                  className="mt-0.5 h-4 w-4 accent-[#1f4d3a]"
                />
                <span>
                  <span className="font-medium">{vertical.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {vertical.itemNoun} · {vertical.packageNoun}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-control bg-forest px-5 text-sm font-medium text-white"
          >
            Create workspace
          </button>
          <Badge tone="outline">Trial · no card required</Badge>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">
          Nothing is charged and no demo rows are copied in. The workspace starts empty so every
          number on the dashboard comes from your own data.
        </p>
      </form>
    </main>
  )
}
