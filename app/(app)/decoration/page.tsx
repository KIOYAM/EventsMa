import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  createDecorationArea,
  createDecorationMaterial,
  createDecorationSetup,
  toggleDecorationAreaActive,
  toggleDecorationMaterialActive,
} from './actions'
import {
  decorationAreas,
  decorationMaterials,
  decorationSetups,
} from '@/lib/db/schema-services'
import { and, eq } from 'drizzle-orm'

export const metadata = { title: 'Decoration' }

export default async function DecorationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const db = getDb()
  const [areas, setups, materials] = await Promise.all(
    ctx.demo || !isDatabaseConfigured()
      ? [[], [], []]
      : [
          db
            .select()
            .from(decorationAreas)
            .where(and(eq(decorationAreas.orgId, ctx.orgId), eq(decorationAreas.active, true)))
            .orderBy(decorationAreas.sortOrder),
          db
            .select()
            .from(decorationSetups)
            .where(eq(decorationSetups.orgId, ctx.orgId))
            .orderBy(decorationSetups.sortOrder),
          db
            .select()
            .from(decorationMaterials)
            .where(and(eq(decorationMaterials.orgId, ctx.orgId), eq(decorationMaterials.active, true)))
            .orderBy(decorationMaterials.sortOrder),
        ],
  )

  const saved = params.saved
  const error = params.error

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decoration & styling"
        title="Your stages, your designs, your materials"
        description="Nothing on this page is a fixed list. Stage backdrops, floral arrangements, lighting and setup schedules are yours to configure — not a template you are stuck with."
        actions={
          <Link
            href="/services/decoration"
            className="inline-flex h-9 items-center rounded-control border border-hairline bg-paper px-3 text-sm font-medium text-ink hover:bg-mint-subtle"
          >
            Service configuration
          </Link>
        }
      />

      {error ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="flex items-center gap-2 rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          <Check className="h-4 w-4" aria-hidden />
          {saved === 'area' ? 'Decoration area saved.' : saved === 'setup' ? 'Setup saved.' : 'Material saved.'}
        </div>
      ) : null}

      {!ctx.demo && !isDatabaseConfigured() ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect a database</CardTitle>
            <CardDescription>
              Decoration configuration requires a Supabase database. Set DATABASE_URL and redeploy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              In demo mode, decoration pages are read-only.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {ctx.demo || isDatabaseConfigured() ? (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ['Areas', areas.length],
              ['Setups', setups.length],
              ['Materials', materials.length],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                    {label}
                  </p>
                  <p className="mt-1 font-display text-2xl text-ink">{value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Decoration areas</CardTitle>
              <CardDescription>
                The physical areas you decorate: stage, entrance, dining, reception, outdoor.
                Two businesses can have entirely different area lists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {areas.length === 0 ? (
                  <p className="text-sm text-ink-muted">No areas yet.</p>
                ) : (
                  areas.map((area) => (
                    <span
                      key={area.id}
                      className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3 py-1 text-xs text-ink"
                    >
                      {area.name}
                      {!area.active ? <span className="text-ink-muted">(off)</span> : null}
                      {canEdit ? (
                        <form action={toggleDecorationAreaActive}>
                          <input type="hidden" name="id" value={area.id} />
                          <input type="hidden" name="active" value={String(!area.active)} />
                          <button
                            type="submit"
                            className="text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                          >
                            {area.active ? 'hide' : 'show'}
                          </button>
                        </form>
                      ) : null}
                    </span>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createDecorationArea} className="grid gap-3 sm:grid-cols-[2fr_3fr_auto]">
                  <Field label="Area name">
                    <Input name="name" required maxLength={120} placeholder="Main stage" />
                  </Field>
                  <Field label="Area type">
                    <Select name="areaType" required>
                      <option value="stage">Stage / mandap</option>
                      <option value="entrance">Entrance</option>
                      <option value="dining">Dining area</option>
                      <option value="reception">Reception</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="ceremony">Ceremony</option>
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Add area
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup &amp; teardown schedule</CardTitle>
              <CardDescription>
                Installation and removal timing per area, with crew assignments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {setups.length === 0 ? (
                  <p className="text-sm text-ink-muted">No setups scheduled yet.</p>
                ) : (
                  setups.map((setup) => (
                    <div
                      key={setup.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {setup.areaId ? `Area ${setup.areaId}` : 'Unassigned area'}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {setup.setupStart ? new Date(setup.setupStart).toLocaleString() : '—'} →{' '}
                          {setup.setupEnd ? new Date(setup.setupEnd).toLocaleString() : '—'}
                        </p>
                        {setup.crewAssigned && (
                          <p className="mt-0.5 text-xs text-ink-muted">Crew: {setup.crewAssigned}</p>
                        )}
                        <p className="mt-0.5 text-xs text-ink-muted">{setup.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createDecorationSetup} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <Field label="Setup start">
                    <Input name="setupStart" type="datetime-local" />
                  </Field>
                  <Field label="Setup end">
                    <Input name="setupEnd" type="datetime-local" />
                  </Field>
                  <Field label="Crew assigned">
                    <Input name="crewAssigned" maxLength={200} placeholder="Decor team A" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Schedule setup
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materials inventory</CardTitle>
              <CardDescription>
                Reusable and consumable decoration materials with cost tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {materials.length === 0 ? (
                  <p className="text-sm text-ink-muted">No materials yet.</p>
                ) : (
                  materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{material.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {material.category} · {material.quantityAvailable} {material.quantityUnit}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          ₹{(material.costPaisePerUnit / 100).toLocaleString('en-IN')}/{
                            material.quantityUnit
                          }
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createDecorationMaterial} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <Field label="Material name">
                    <Input name="name" required maxLength={120} placeholder="White floral arch" />
                  </Field>
                  <Field label="Category">
                    <Input name="category" required maxLength={64} placeholder="Floral" />
                  </Field>
                  <Field label="Unit">
                    <Input name="unit" required maxLength={32} placeholder="piece" />
                  </Field>
                  <Field label="Cost per unit (₹)">
                    <Input name="costPaisePerUnit" type="number" inputMode="numeric" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Add material
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
