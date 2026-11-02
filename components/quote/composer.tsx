'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { saveQuotation } from '@/app/(app)/quotes/actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { computeQuote, groupByService } from '@/lib/domain/pricing'
import { formatINR, formatPercentBp, parseRupees } from '@/lib/domain/money'
import { unitClassLabel, type UnitClass } from '@/lib/domain/units'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { cn } from '@/lib/utils'

interface CatalogueItem {
  id: string
  verticalKey: string
  name: string
  unitClass: UnitClass
  pricePaise: number
  costPaise: number | null
  taxRateBp: number
}

interface DraftLine {
  key: string
  serviceKey: string
  label: string
  unitClass: UnitClass
  unitRatePaise: number
  quantity: number
  minQuantity: number
  taxRateBp: number
  costPerUnitPaise: number | null
}

function todayISO(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

export function QuoteComposer({
  demo,
  services,
  items,
  clients,
}: {
  demo: boolean
  services: { verticalKey: string; config: Record<string, string> }[]
  items: CatalogueItem[]
  clients: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(todayISO())
  const [guests, setGuests] = useState(250)
  const [clientId, setClientId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [lines, setLines] = useState<DraftLine[]>([])
  const [activeService, setActiveService] = useState(services[0]?.verticalKey ?? 'catering')

  const computed = useMemo(
    () =>
      computeQuote({
        guests,
        lines: lines.map((line) => ({
          id: line.key,
          serviceKey: line.serviceKey,
          label: line.label,
          unitClass: line.unitClass,
          unitRatePaise: line.unitRatePaise,
          quantity: line.quantity,
          minQuantity: line.minQuantity,
          taxRateBp: line.taxRateBp,
          costPerUnitPaise: line.costPerUnitPaise ?? 0,
        })),
        orderDiscount:
          discountPercent > 0
            ? { kind: 'percent' as const, value: discountPercent, reason: 'Negotiated' }
            : null,
      }),
    [guests, lines, discountPercent],
  )

  const groups = useMemo(() => groupByService(computed.lines), [computed.lines])
  const serviceItems = items.filter((item) => item.verticalKey === activeService)

  function addItem(item: CatalogueItem) {
    setLines((prev) => [
      ...prev,
      {
        key: `${item.id}-${prev.length}-${Date.now()}`,
        serviceKey: item.verticalKey,
        label: item.name,
        unitClass: item.unitClass,
        unitRatePaise: item.pricePaise,
        quantity: item.unitClass === 'PER_GUEST' ? 0 : 1,
        minQuantity: 0,
        taxRateBp: item.taxRateBp,
        costPerUnitPaise: item.costPaise,
      },
    ])
  }

  function patchLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((line) => line.key !== key))
  }

  function onSave() {
    if (!title.trim()) {
      toast.error('Give the quote a title, for example “Meera & Karthik — wedding lunch”.')
      return
    }
    if (lines.length === 0) {
      toast.error('Add at least one line from your catalogue.')
      return
    }

    startTransition(async () => {
      const result = await saveQuotation({
        title: title.trim(),
        eventDate,
        guests,
        clientId: clientId || undefined,
        venueName: venueName || undefined,
        lines: lines.map((line) => ({
          id: line.key.slice(0, 64),
          serviceKey: line.serviceKey,
          label: line.label,
          unitClass: line.unitClass,
          unitRatePaise: line.unitRatePaise,
          quantity: line.quantity,
          minQuantity: line.minQuantity,
          taxRateBp: line.taxRateBp,
          costPerUnitPaise: line.costPerUnitPaise ?? undefined,
        })),
        discountKind: 'percent',
        discountValue: discountPercent,
        clientTotalPaise: computed.totalPaise,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Quotation ${result.number} created`)
      router.push(`/quotes/${result.quotationId}`)
    })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Event</CardTitle>
            <Badge tone="outline">{demo ? 'Demo' : 'Server-verified'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Quote title" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meera & Karthik — wedding lunch"
                maxLength={160}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Event date" htmlFor="eventDate">
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </Field>
              <Field label="Guests" htmlFor="guests">
                <Input
                  id="guests"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Client" htmlFor="client">
                <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">No client linked</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Venue" htmlFor="venue">
                <Input
                  id="venue"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Sree Lakshmi Mahal"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add from your services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {services.map((service) => {
                const descriptor = verticalDescriptor(service.verticalKey)
                const isActive = service.verticalKey === activeService
                return (
                  <button
                    key={service.verticalKey}
                    type="button"
                    onClick={() => setActiveService(service.verticalKey)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3.5 py-2 text-sm',
                      isActive
                        ? 'bg-forest font-medium text-white'
                        : 'border border-hairline text-ink-muted',
                    )}
                  >
                    {descriptor.label}
                  </button>
                )
              })}
            </div>

            {serviceItems.length === 0 ? (
              <p className="rounded-control bg-mint-subtle px-3 py-2 text-sm text-forest">
                Nothing in this service&apos;s catalogue yet. Add an item under Catalogue first.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {serviceItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2.5 text-left hover:border-mint hover:bg-mint-subtle"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{item.name}</span>
                      <span className="block text-xs text-ink-muted">
                        {unitClassLabel(item.unitClass)} · {formatPercentBp(item.taxRateBp)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="tabular text-sm text-ink">{formatINR(item.pricePaise)}</span>
                      <Plus className="h-4 w-4 text-forest" aria-hidden />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lines</CardTitle>
            <Badge tone="neutral">{lines.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No lines yet. Pick an item above; each one keeps its own unit and tax rate.
              </p>
            ) : (
              lines.map((line) => {
                const basis =
                  line.unitClass === 'PER_GUEST'
                    ? Math.max(guests, line.minQuantity)
                    : line.unitClass === 'FLAT'
                      ? 1
                      : line.quantity
                return (
                  <div
                    key={line.key}
                    className="rounded-control border border-hairline bg-canvas/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{line.label}</p>
                        <p className="text-xs text-ink-muted">
                          {verticalDescriptor(line.serviceKey).label} ·{' '}
                          {unitClassLabel(line.unitClass)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="rounded-control p-1.5 text-ink-muted hover:bg-terracotta-soft hover:text-terracotta"
                        aria-label={`Remove ${line.label}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <label className="text-xs text-ink-muted">
                        Rate (₹)
                        <Input
                          className="mt-1 h-9"
                          inputMode="decimal"
                          value={line.unitRatePaise / 100}
                          onChange={(e) => {
                            const paise = parseRupees(e.target.value)
                            patchLine(line.key, { unitRatePaise: paise ?? 0 })
                          }}
                        />
                      </label>
                      <label className="text-xs text-ink-muted">
                        {line.unitClass === 'PER_GUEST' ? 'Guests' : 'Qty'}
                        <Input
                          className="mt-1 h-9"
                          inputMode="numeric"
                          disabled={line.unitClass === 'PER_GUEST' || line.unitClass === 'FLAT'}
                          value={line.unitClass === 'PER_GUEST' ? guests : line.quantity}
                          onChange={(e) =>
                            patchLine(line.key, { quantity: Number(e.target.value) || 0 })
                          }
                        />
                      </label>
                      <label className="text-xs text-ink-muted">
                        Tax %
                        <Input
                          className="mt-1 h-9"
                          inputMode="decimal"
                          value={line.taxRateBp / 100}
                          onChange={(e) =>
                            patchLine(line.key, {
                              taxRateBp: Math.round((Number(e.target.value) || 0) * 100),
                            })
                          }
                        />
                      </label>
                      <div className="text-xs text-ink-muted">
                        Amount
                        <p className="tabular mt-2 text-sm font-medium text-ink">
                          {formatINR(line.unitRatePaise * basis)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <Badge tone="outline">Server re-checks</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>Subtotal</dt>
                <dd className="tabular">{formatINR(computed.subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Tax</dt>
                <dd className="tabular">{formatINR(computed.taxPaise)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Round-off</dt>
                <dd className="tabular">{formatINR(computed.roundOffPaise)}</dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-base font-semibold text-forest">
                <dt>Total</dt>
                <dd className="tabular">{formatINR(computed.totalPaise)}</dd>
              </div>
            </dl>

            <Field label="Discount %" htmlFor="discount">
              <Input
                id="discount"
                inputMode="decimal"
                value={discountPercent}
                onChange={(e) =>
                  setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                }
              />
            </Field>
            {computed.discountClamped ? (
              <p className="text-xs text-warning">
                Discount was larger than the subtotal and was capped. Nothing is hidden from you.
              </p>
            ) : null}

            <div className="rounded-control bg-mint-subtle px-3 py-2">
              <p className="text-xs text-ink-muted">Margin at the current cost</p>
              <p className="tabular text-lg font-semibold text-forest">
                {formatPercentBp(computed.marginBp)}
              </p>
              <p className="tabular text-xs text-ink-muted">
                {formatINR(computed.marginPaise)} contribution
              </p>
            </div>

            <div className="space-y-1">
              {groups.map((group) => (
                <div
                  key={group.serviceKey}
                  className="flex justify-between text-xs text-ink-muted"
                >
                  <span>{verticalDescriptor(group.serviceKey).label}</span>
                  <span className="tabular">{formatINR(group.subtotalPaise)}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {pending ? 'Saving…' : 'Save and share'}
            </button>
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Saved as version 1 and frozen. Editing later creates version 2; the sent copy never
              changes.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
