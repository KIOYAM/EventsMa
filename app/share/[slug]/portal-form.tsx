'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, Loader2, Send, Sparkles } from 'lucide-react'
import { formatINR } from '@/lib/domain/money'
import { basisForUnit } from '@/lib/domain/share-pricing'
import type { UnitClass } from '@/lib/domain/units'
import {
  menuTotals,
  sessionProblems,
  toggleDish,
  type MenuCategory,
  type MenuSelection,
} from '@/lib/domain/menu-selection'
import type { SharePortal } from '@/lib/db/share'
import { MenuPicker } from './_components/menu-picker'
import { PlatePreview } from './_components/plate-preview'
import { ServiceSection } from './_components/service-section'

export function PortalForm({ portal }: { portal: SharePortal }) {
  const guests = portal.event?.guests ?? 0

  const [menuSelections, setMenuSelections] = useState<Record<string, MenuSelection>>({})
  /**
   * The latest selections, read synchronously inside the toggle.
   *
   * React state is only current for the render that produced it, so two taps in
   * the same frame would both start from the same snapshot and the second would
   * wipe the first. A real customer taps fast; the ref keeps every tap.
   */
  const selectionsRef = useRef<Record<string, MenuSelection>>({})
  const [activeSession, setActiveSession] = useState(portal.menu[0]?.id ?? '')
  const [blocked, setBlocked] = useState<string | null>(null)

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
      {
        serviceKey: string
        name: string
        unitClass: UnitClass
        pricePaise: number
        unitLabel: string | null
      }
    >()
    for (const service of portal.services) {
      for (const category of service.categories) {
        for (const item of category.items) {
          map.set(item.id, {
            serviceKey: service.key,
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
          quantity,
          basis,
          amountPaise: Math.max(0, Math.round(found.pricePaise * basis)),
        }
      })
      .filter((line): line is NonNullable<typeof line> => line !== null)
  }, [selected, index, guests])

  const menu = useMemo(
    () => menuTotals(portal.menu, menuSelections),
    [portal.menu, menuSelections],
  )

  // Only sessions the customer actually touched are validated: leaving dinner
  // empty is a choice, not an error, and the owner sees which sessions were picked.
  const touchedSessions = portal.menu.filter(
    (session) => (menu.sessions.find((row) => row.sessionId === session.id)?.dishCount ?? 0) > 0,
  )
  const problems = touchedSessions.flatMap((session) =>
    sessionProblems(session, menuSelections[session.id] ?? {}).map(
      (problem) => `${session.name} · ${problem.name}: ${problem.message}`,
    ),
  )

  const cataloguePaise = lines.reduce((sum, line) => sum + line.amountPaise, 0)
  const totalPaise = cataloguePaise + menu.paise
  const nothingChosen = lines.length === 0 && menu.dishCount === 0

  const onToggleDish = (sessionId: string, category: MenuCategory, dishId: string) => {
    const current = selectionsRef.current
    const outcome = toggleDish(category, current[sessionId] ?? {}, dishId)
    if (outcome.blocked === 'maximum') {
      setBlocked(category.id)
      window.setTimeout(() => setBlocked(null), 1600)
      return
    }
    const next = { ...current, [sessionId]: outcome.selection }
    selectionsRef.current = next
    setMenuSelections(next)
  }

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

    if (nothingChosen) {
      setError(
        portal.menu.length > 0
          ? 'Pick at least one dish before sending your request.'
          : 'Choose at least one item before submitting.',
      )
      return
    }
    if (problems.length > 0) {
      setError(problems[0] ?? 'Please check your selections.')
      return
    }

    const menuSelectionsPayload = portal.menu
      .map((session) => ({
        sessionId: session.id,
        dishIds: Object.values(menuSelections[session.id] ?? {}).flat(),
      }))
      .filter((entry) => entry.dishIds.length > 0)

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
          menuSelections: menuSelectionsPayload,
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
          Thank you — your host has your menu and your details, and will come back with a
          confirmed quotation. Nothing is booked or charged from this page.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          {portal.menu.length > 0 ? (
            <MenuPicker
              sessions={portal.menu}
              selections={menuSelections}
              activeId={activeSession}
              onActive={setActiveSession}
              onToggle={onToggleDish}
              blockedCategoryId={blocked}
            />
          ) : null}

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

          {portal.services.length === 0 && portal.menu.length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-paper px-5 py-8 text-center">
              <Sparkles className="mx-auto mb-3 h-6 w-6 text-ink-muted" aria-hidden />
              <p className="text-sm text-ink-muted">
                The menu for this link is being prepared. Please contact the organiser directly.
              </p>
            </div>
          ) : null}

          {portal.menu.length > 0 ? (
            <PlatePreview
              sessions={portal.menu}
              selections={menuSelections}
              className="lg:hidden"
            />
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
        </div>

        <aside className="hidden lg:sticky lg:top-6 lg:block">
          {portal.menu.length > 0 ? (
            <PlatePreview sessions={portal.menu} selections={menuSelections} />
          ) : null}
          <div className="mt-4 rounded-2xl border border-hairline bg-paper p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Summary
            </p>
            <dl className="mt-2 space-y-1.5 text-xs">
              {menu.dishCount > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Dishes chosen</dt>
                  <dd className="tabular text-ink">{menu.dishCount}</dd>
                </div>
              ) : null}
              {lines.length > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Other items</dt>
                  <dd className="tabular text-ink">{lines.length}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2 border-t border-hairline pt-1.5">
                <dt className="font-medium text-ink">Indicative</dt>
                <dd className="tabular font-medium text-forest">{formatINR(totalPaise)}</dd>
              </div>
            </dl>
            {problems.length > 0 ? (
              <p className="mt-2 text-[11px] leading-relaxed text-clay">{problems[0]}</p>
            ) : null}
          </div>
        </aside>
      </div>

      <section className="sticky bottom-2 z-10 rounded-2xl border border-forest/20 bg-forest p-3 text-white shadow-lg sm:bottom-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">
              Indicative estimate
            </p>
            <p className="font-display text-xl leading-tight tabular sm:text-2xl">
              {formatINR(totalPaise)}
            </p>
            <p className="truncate text-[10px] text-white/70 sm:text-[11px]">
              {menu.dishCount > 0
                ? `${menu.dishCount} dish${menu.dishCount === 1 ? '' : 'es'}`
                : 'No dishes yet'}
              {lines.length > 0 ? ` · ${lines.length} other item${lines.length === 1 ? '' : 's'}` : ''}
              {' · before tax'}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || nothingChosen || problems.length > 0}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-forest disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5"
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
        {error ? <p className="mt-2 text-xs leading-snug text-[#ffd9c9] sm:text-sm">{error}</p> : null}
        {problems.length > 0 ? (
          <p className="mt-1.5 text-[11px] leading-snug text-white/80">{problems[0]}</p>
        ) : null}
        <p className="mt-1.5 hidden text-[11px] leading-relaxed text-white/70 sm:block">
          This estimate uses your host&apos;s published rates for your guest count. The organiser
          confirms the final quotation.
        </p>
      </section>
    </form>
  )
}
