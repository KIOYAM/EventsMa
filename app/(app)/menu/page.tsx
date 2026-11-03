import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getMenuBoard } from '@/lib/db/menu'
import { DIETARY, MEAL_SUGGESTIONS, itemCount, windowLabel } from '@/lib/domain/menu'
import { formatINR } from '@/lib/domain/money'
import { unitClassLabel } from '@/lib/domain/units'
import { MAX_IMAGE_BYTES, ORG_IMAGE_QUOTA_BYTES } from '@/lib/storage/menu-images'
import { createMenuGroup, createMenuItem, createMenuSection } from './actions'

export const metadata = { title: 'Menu' }

const ERROR_COPY: Record<string, string> = {
  name: 'A name and a price are required.',
  time: 'Service times must be written as 07:00 or 19:30.',
  section: 'That meal period no longer exists.',
  group: 'That group no longer exists.',
  permission: 'Only an owner or manager can edit the menu.',
  demo: 'Demo mode: connect a database before changing the menu.',
  image_empty: 'The selected file was empty.',
  image_type: 'Images must be WebP, JPEG or PNG.',
  image_size: `Each image must be under ${Math.round(MAX_IMAGE_BYTES / 1024)} KB.`,
  image_quota: 'This workspace has reached its 25 MB menu-image quota.',
  image_storage: 'Image storage is not configured yet. Add the Supabase keys to enable uploads.',
  image_failed: 'The upload failed. The dish was not saved; try again.',
}

const kilos = (milli: number) => (milli / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 })

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; view?: string; error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const board = await getMenuBoard(ctx.orgId, ctx.demo)

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const view = params.view === 'list' ? 'list' : 'grouped'
  const selected = board.sections.find((section) => section.id === params.section) ?? null
  const visible = selected ? [selected] : board.sections

  const allItems = board.sections.flatMap((section) =>
    section.groups.flatMap((group) => group.items.map((item) => ({ section, group, item }))),
  )
  const usedPct = Math.min(100, Math.round((board.imageBytes / ORG_IMAGE_QUOTA_BYTES) * 100))
  const groupOptions = board.sections.flatMap((section) =>
    section.groups.map((group) => ({ id: group.id, label: `${section.name} · ${group.name}` })),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Menu"
        title="Meal periods, groups and the dishes inside them"
        description="Breakfast holds its own groups and dishes, with the service window printed on the menu. The same dish can be quoted without any of this structure."
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Saved.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">Meal periods</p>
            <p className="tabular text-2xl font-semibold text-ink">{board.sections.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-muted">Dishes on the menu</p>
            <p className="tabular text-2xl font-semibold text-ink">{allItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 pt-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-ink-muted">Menu images</p>
              <p className="tabular text-xs text-ink">
                {(board.imageBytes / 1024 / 1024).toFixed(1)} / 25 MB
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-mint-subtle">
              <div className="h-full rounded-full bg-forest" style={{ width: `${usedPct}%` }} />
            </div>
            <p className="text-[11px] text-ink-muted">
              Max {Math.round(MAX_IMAGE_BYTES / 1024)} KB each, WebP preferred.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Link
            href={`/menu?view=${view}`}
            className={
              selected
                ? 'whitespace-nowrap rounded-full border border-hairline bg-paper px-4 py-2 text-sm text-ink-muted'
                : 'whitespace-nowrap rounded-full bg-forest px-4 py-2 text-sm font-medium text-white'
            }
          >
            All meals
          </Link>
          {board.sections.map((section) => {
            const active = section.id === params.section
            return (
              <Link
                key={section.id}
                href={`/menu?section=${section.id}&view=${view}`}
                className={
                  active
                    ? 'whitespace-nowrap rounded-full bg-forest px-4 py-2 text-sm font-medium text-white'
                    : 'whitespace-nowrap rounded-full border border-hairline bg-paper px-4 py-2 text-sm text-ink-muted'
                }
              >
                {section.name}
                <span className="ml-1.5 text-[11px] opacity-70">{itemCount(section)}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex rounded-control border border-hairline bg-paper p-1 text-xs">
          {(['grouped', 'list'] as const).map((mode) => (
            <Link
              key={mode}
              href={`/menu?view=${mode}${params.section ? `&section=${params.section}` : ''}`}
              className={
                view === mode
                  ? 'rounded-[8px] bg-mint px-3 py-1.5 font-medium text-forest'
                  : 'rounded-[8px] px-3 py-1.5 text-ink-muted'
              }
            >
              {mode === 'grouped' ? 'Grouped' : 'Full list'}
            </Link>
          ))}
        </div>
      </div>

      {board.sections.length === 0 ? (
        <EmptyState
          title="No meal periods yet"
          description="Add Breakfast, Lunch or Dinner below. Each one holds its own groups and dishes."
        />
      ) : view === 'grouped' ? (
        <div className="space-y-6">
          {visible.map((section) => (
            <section key={section.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline pb-2">
                <h2 className="text-sm font-semibold text-ink">{section.name}</h2>
                <p className="text-xs text-ink-muted">
                  {windowLabel(section.windowStart, section.windowEnd)} · {section.groups.length} groups ·{' '}
                  {itemCount(section)} dishes
                </p>
              </div>

              {section.groups.length === 0 ? (
                <p className="rounded-card border border-dashed border-hairline px-4 py-6 text-center text-xs text-ink-muted">
                  No groups in {section.name} yet.
                </p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {section.groups.map((group) => (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="space-y-1">
                          <CardTitle>{group.name}</CardTitle>
                          {group.description ? (
                            <p className="text-xs text-ink-muted">{group.description}</p>
                          ) : null}
                        </div>
                        <Badge tone="outline">{group.items.length}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {group.items.length === 0 ? (
                          <p className="text-xs text-ink-muted">No dishes in this group yet.</p>
                        ) : (
                          group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 border-b border-hairline py-2.5 last:border-b-0"
                            >
                              <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-control bg-mint-subtle text-forest">
                                {item.imagePath ? (
                                  <ImageIcon className="h-4 w-4" aria-label="Has a photo" />
                                ) : (
                                  <span className="text-[10px] font-semibold">
                                    {item.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate text-sm text-ink">{item.name}</p>
                                  {item.dietary ? (
                                    <Badge tone={DIETARY[item.dietary].tone}>{DIETARY[item.dietary].label}</Badge>
                                  ) : null}
                                </div>
                                {item.description ? (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{item.description}</p>
                                ) : null}
                              </div>
                              <p className="tabular flex-none text-sm text-ink">
                                {formatINR(item.pricePaise)}
                                <span className="block text-right text-[10px] text-ink-muted">
                                  {unitClassLabel(item.unitClass).toLowerCase()}
                                </span>
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-hairline bg-paper">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Meal</th>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Dish</th>
                <th className="px-4 py-3 font-medium">Diet</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {visible.flatMap((section) =>
                section.groups.flatMap((group) =>
                  group.items.map((item) => (
                    <tr key={item.id} className="border-b border-hairline last:border-b-0">
                      <td className="px-4 py-3 text-xs text-ink-muted">
                        {section.name}
                        <span className="block text-[10px]">
                          {windowLabel(section.windowStart, section.windowEnd)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">{group.name}</td>
                      <td className="px-4 py-3">
                        <p className="text-ink">{item.name}</p>
                        {item.description ? (
                          <p className="text-[11px] text-ink-muted">{item.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {item.dietary ? (
                          <Badge tone={DIETARY[item.dietary].tone}>{DIETARY[item.dietary].label}</Badge>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="tabular px-4 py-3 text-right text-ink">{formatINR(item.pricePaise)}</td>
                    </tr>
                  )),
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <details className="rounded-card border border-hairline bg-paper">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">
            Add a meal period
          </summary>
          <form action={createMenuSection} className="space-y-3 border-t border-hairline px-4 py-4">
            <Field label="Name" htmlFor="sectionName">
              <Input id="sectionName" name="name" list="mealSuggestions" required maxLength={80} placeholder="Breakfast" />
            </Field>
            <datalist id="mealSuggestions">
              {MEAL_SUGGESTIONS.map((meal) => (
                <option key={meal} value={meal} />
              ))}
            </datalist>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts" htmlFor="windowStart" hint="24h, e.g. 07:00">
                <Input id="windowStart" name="windowStart" placeholder="07:00" pattern="[0-2][0-9]:[0-5][0-9]" />
              </Field>
              <Field label="Ends" htmlFor="windowEnd" hint="e.g. 10:30">
                <Input id="windowEnd" name="windowEnd" placeholder="10:30" pattern="[0-2][0-9]:[0-5][0-9]" />
              </Field>
            </div>
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Add meal period
            </button>
          </form>
        </details>

        <details className="rounded-card border border-hairline bg-paper">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">Add a group</summary>
          <form action={createMenuGroup} className="space-y-3 border-t border-hairline px-4 py-4">
            <Field label="Meal period" htmlFor="groupSection">
              <Select id="groupSection" name="sectionId" required defaultValue={params.section ?? ''}>
                <option value="" disabled>
                  Choose
                </option>
                {board.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Group name" htmlFor="groupName">
              <Input id="groupName" name="name" required maxLength={80} placeholder="South Indian hot" />
            </Field>
            <Field label="Note" htmlFor="groupDescription" hint="Shown under the group heading.">
              <Input id="groupDescription" name="description" maxLength={240} placeholder="Refilled every 15 minutes" />
            </Field>
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Add group
            </button>
          </form>
        </details>

        <details className="rounded-card border border-hairline bg-paper">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">Add a dish</summary>
          <form action={createMenuItem} className="space-y-3 border-t border-hairline px-4 py-4">
            <Field label="Group" htmlFor="itemGroup">
              <Select id="itemGroup" name="groupId" required defaultValue="">
                <option value="" disabled>
                  Choose
                </option>
                {groupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dish" htmlFor="itemName">
              <Input id="itemName" name="name" required maxLength={160} placeholder="Mini ghee dosa" />
            </Field>
            <Field label="Description" htmlFor="itemDescription">
              <Input id="itemDescription" name="description" maxLength={400} placeholder="Made to order on the dosa station" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)" htmlFor="itemPrice">
                <Input id="itemPrice" name="price" inputMode="decimal" required placeholder="60" />
              </Field>
              <Field label="Diet" htmlFor="itemDietary">
                <Select id="itemDietary" name="dietary" defaultValue="">
                  <option value="">Not set</option>
                  <option value="veg">Veg</option>
                  <option value="egg">Egg</option>
                  <option value="non_veg">Non-veg</option>
                </Select>
              </Field>
            </div>
            <Field
              label="Photo"
              htmlFor="itemImage"
              hint={`WebP, JPEG or PNG · max ${Math.round(MAX_IMAGE_BYTES / 1024)} KB`}
            >
              <Input id="itemImage" name="image" type="file" accept="image/webp,image/jpeg,image/png" />
            </Field>
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Add dish
            </button>
            {!canEdit ? (
              <p className="text-xs text-ink-muted">
                {ctx.demo ? 'Demo mode is read-only.' : 'Owner or manager only.'}
              </p>
            ) : null}
          </form>
        </details>
      </div>

      <p className="text-[11px] text-ink-muted">
        {board.imageBytes > 0 ? `${kilos(board.imageBytes)} KB of images stored` : 'No images stored yet'} ·
        limit {ORG_IMAGE_QUOTA_BYTES / 1024 / 1024} MB per business. Deleting a dish does not delete its file yet.
      </p>
    </div>
  )
}
