'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, Minus, Plus, Send, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/domain/money'
import { unitClassLabel, type UnitClass } from '@/lib/domain/units'
import { basisForUnit } from '@/lib/domain/share-pricing'
import type { PortalService, SharePortal } from '@/lib/db/share'

interface Props {
  portal: SharePortal
}

export function PortalForm({ portal }: Props) {
  const guests = portal.event?.guests ?? 0
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const index = useMemo(() => {
    const map = new Map<
      string,
      { serviceKey: string; serviceLabel: string; name: string; unitClass: UnitClass; pricePaise: number; unitLabel: string | null }
    >()
    for (const service of portal.services) {
      for (const category of service.categories) {
        for (const item of category.items) {
          map.set(item.id, {
            serviceKey: service.key,
            serviceLabel: service.label,
            name: item.name,
            unitClass: item.unitClass,
            pricePaise: item.pricePaise,
            unitLabel: item.unitLabel,
          })
        }
      }
    }
    return map
  }, [portal.services])

  const lines = useMemo(() => {
    return Object.entries(selected)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const found = index.get(itemId)
        if (!found) return null
        const basis = basisForUnit(found.unitClass, guests, quantity)
        return {
          itemId,
          serviceKey: found.serviceKey,
          serviceLabel: found.serviceLabel,
          name: found.name,
          quantity,
          unitClass: found.unitClass,
          unitLabel: found.unitLabel,
          basis,
          amountPaise: Math.max(0, Math.round(found.pricePaise * basis)),
        }
      })
      .filter((line): line is NonNullable<typeof line> => line !== null)
  }, [selected, index, guests])

  const totalPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0)
  const serviceCount = new Set(lines.map((line) => line.serviceKey)).size

  const toggle = (itemId: string, unitClass: UnitClass) => {
    setSelected((current) => {
      const next = { ...current }
      if (next[itemId]) delete next[itemId]
      else next[itemId] = unitClass === 'PER_GUEST' ? Math.max(guests, 1) : 1
      return next
    })
  }

  const setQuantity = (itemId: string, quantity: number) => {
    setSelected((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[itemId]
      else next[itemId] = Math.min(quantity, 10_000)
      return next
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (lines.length === 0) {
      setError('Choose at least one item before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/share/${encodeURIComponent(portal.token)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          message,
          selections: lines.map((line) => ({
            serviceKey: line.serviceKey,
            itemId: line.itemId,
            quantity: line.quantity,
          })),
        }),
      })
      const payload = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'We could not submit your request. Please try again.')
        setSubmitting(false)
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-mint bg-mint-subtle px-6 py-10 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-forest text-white">
          <Check className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="font-display text-2xl text-forest">Request received</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
          Thank you for sharing your event requirements. Our team has received your request and
          will contact you shortly with a customized quotation.
        </p>
        <p className="mt-4 text-xs text-ink-muted">
          This is an indicative estimate only. Nothing is booked or charged from this page.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {portal.services.map((service) => (
        <ServiceSection
          key={service.key}
          service={service}
          guests={guests}
          selected={selected}
          onToggle={toggle}
          onQuantity={setQuantity}
        />
      ))}

      {portal.services.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-paper px-5 py-8 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-ink-muted" aria-hidden />
          <p className="text-sm text-ink-muted">
            The catalogue for this link is being prepared. Please contact the organiser directly.
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-hairline bg-paper p-4 sm:p-6">
        <h2 className="font-display text-xl text-forest">Your details</h2>
        <p className="mt-1 text-sm text-ink-muted">
          We only ask for what the organiser needs to prepare your quotation.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-ink">Name</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              maxLength={120}
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm text-ink"
              placeholder="Your full name"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Phone</span>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              type="tel"
              maxLength={24}
              autoComplete="tel"
              inputMode="tel"
              className="h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm text-ink"
              placeholder="+91 98765 43210"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
            <input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              type="email"
              maxLength={160}
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm text-ink"
              placeholder="you@example.com"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-ink">Anything else?</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink"
              placeholder="Timings, themes, dietary needs, people counts…"
            />
          </label>
        </div>
      </section>

      <section className="sticky bottom-3 z-10 rounded-2xl border border-forest/20 bg-forest p-4 text-white shadow-lg sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/70">
              Indicative estimate
            </p>
            <p className="font-display text-2xl tabular">{formatINR(totalPaise)}</p>
            <p className="text-[11px] text-white/70">
              {lines.length} item{lines.length === 1 ? '' : 's'} across {serviceCount} service
              {serviceCount === 1 ? '' : 's'} · before tax
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-forest disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden /> Send request
              </>
            )}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-[#ffd9c9]">{error}</p> : null}
        <p className="mt-2 text-[11px] leading-relaxed text-white/70">
          This estimate uses published catalogue rates for your guest count. The organiser confirms
          the final quotation.
        </p>
      </section>
    </form>
  )
}

function ServiceSection({
  service,
  guests,
  selected,
  onToggle,
  onQuantity,
}: {
  service: PortalService
  guests: number
  selected: Record<string, number>
  onToggle: (itemId: string, unitClass: UnitClass) => void
  onQuantity: (itemId: string, quantity: number) => void
}) {
  const chosenCount = service.categories
    .flatMap((category) => category.items)
    .filter((item) => selected[item.id]).length

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-forest">{service.label}</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{service.description}</p>
        </div>
        <Badge tone={chosenCount > 0 ? 'success' : 'outline'}>
          {chosenCount > 0 ? `${chosenCount} selected` : 'Optional'}
        </Badge>
      </div>

      {service.notes.length > 0 ? (
        <dl className="mt-4 grid gap-2 rounded-xl bg-canvas p-3 text-xs sm:grid-cols-2">
          {service.notes.map((note) => (
            <div key={note.label}>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{note.label}</dt>
              <dd className="mt-0.5 text-ink">{note.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-5 space-y-5">
        {service.categories.map((category) => (
          <div key={`${service.key}-${category.name}`}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              {category.name}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {category.items.map((item) => {
                const quantity = selected[item.id] ?? 0
                const picked = quantity > 0
                const basis = basisForUnit(item.unitClass, guests, quantity || 1)
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      picked ? 'border-forest bg-mint-subtle' : 'border-hairline bg-canvas'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(item.id, item.unitClass)}
                      aria-pressed={picked}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                          picked ? 'border-forest bg-forest text-white' : 'border-ink-muted/40'
                        }`}
                      >
                        {picked ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{item.name}</span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs text-ink-muted">{item.description}</span>
                        ) : null}
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-forest">
                            {formatINR(item.pricePaise)}
                          </span>
                          <span className="text-[10px] text-ink-muted">
                            {item.unitLabel ?? unitClassLabel(item.unitClass)}
                          </span>
                          {item.dietary ? <Badge tone="outline" className="text-[9px]">{item.dietary}</Badge> : null}
                        </span>
                      </span>
                    </button>

                    {picked && item.unitClass !== 'PER_GUEST' && item.unitClass !== 'FLAT' ? (
                      <div className="mt-2 flex items-center justify-between border-t border-forest/15 pt-2">
                        <span className="text-[11px] text-ink-muted">Quantity</span>
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onQuantity(item.id, quantity - 1)}
                            className="grid h-7 w-7 place-items-center rounded-md border border-hairline bg-paper"
                            aria-label={`Fewer ${item.name}`}
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </button>
                          <span className="w-8 text-center text-sm tabular text-ink">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => onQuantity(item.id, quantity + 1)}
                            className="grid h-7 w-7 place-items-center rounded-md border border-hairline bg-paper"
                            aria-label={`More ${item.name}`}
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </span>
                      </div>
                    ) : null}

                    {picked ? (
                      <p className="mt-2 border-t border-forest/15 pt-2 text-[11px] text-ink-muted">
                        {item.unitClass === 'PER_GUEST'
                          ? `${Math.max(guests, 0)} guests × ${formatINR(item.pricePaise)} = `
                          : `${basis} × ${formatINR(item.pricePaise)} = `}
                        <span className="font-medium text-forest">
                          {formatINR(Math.round(item.pricePaise * basis))}
                        </span>
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
