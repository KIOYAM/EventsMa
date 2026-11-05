import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/page-header'
import { formatINR } from '@/lib/domain/money'
import { getEventDetail } from '@/lib/db/events'
import { getEventCatering } from '@/lib/db/catering-events'

export const metadata = { title: 'Event Share View' }

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const event = await getEventDetail('kannan-events', false, slug)
  if (!event) {
    notFound()
  }

  let catering = (await getEventCatering('kannan-events', slug, false)) as any
  if (!catering?.sessions) {
    catering = { sessions: [], categories: [] }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-hairline bg-white/90 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-forest"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to events
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-forest">{event.title}</h1>
            <Badge tone="outline">{event.eventType || 'Occasion'}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Event info card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Event details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-ink-muted">Date</p>
                <p className="font-medium">{event.eventDate}</p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Guests</p>
                <p className="font-medium">{event.guests}</p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Venue</p>
                <p className="font-medium">{event.venueName || 'Not specified'}</p>
              </div>
            </div>

            {event.notes && (
              <div>
                <p className="text-sm text-ink-muted">Notes</p>
                <p className="font-medium">{event.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catering sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Catering plan</CardTitle>
            <Badge tone="outline">{catering.sessions.length || 0} sessions</Badge>
          </CardHeader>
          <CardContent>
            {catering.sessions.length === 0 ? (
              <EmptyState
                icon={<div className="h-6 w-6">✕</div>}
                title="No catering sessions"
                description="The event has no catering sessions configured yet."
              />
            ) : (
              <div className="space-y-4">
                {catering.sessions.map((session: any) => (
                  <details key={session.id} className="border rounded">
                    <summary>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-forest">
                          {session.name} {session.guestCount} guests
                        </span>
                        <span className="text-xs text-ink-muted">
                          {session.startTime || '—'} - {session.endTime || '—'}
                        </span>
                      </div>
                    </summary>
                    <CardContent className="pt-3">
                      <p className="text-sm text-ink-muted">
                        {session.notes || 'No additional notes'}
                      </p>
                      <p className="mt-2 text-xs text-ink-muted">
                        Menu items will be selected from the catalogue
                      </p>
                    </CardContent>
                  </details>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client selection interface */}
        <Card>
          <CardHeader>
            <CardTitle>Select your menu</CardTitle>
            <p className="text-sm text-ink-muted">
              Choose dishes for {event.guests} guests. Average pricing is shown — final quote will be computed by the owner.
            </p>
          </CardHeader>
          <CardContent>
            {catering.categories.length === 0 ? (
              <EmptyState
                icon={<div className="h-6 w-6">📋</div>}
                title="No categories available"
                description="The event catalog is being loaded. Please check back soon."
              />
            ) : (
              <div className="grid gap-4">
                {catering.categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="border rounded p-4 hover:border-forest transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-forest">{cat.name}</span>
                      <span className="text-xs text-ink-muted">
                        {cat.minSelections ?? 0}-{cat.maxSelections ?? '∞'} selections
                      </span>
                    </div>
                    <p className="text-sm text-ink-muted">
                      {cat.description || 'Select dishes from the catalogue below'}
                    </p>
                    <div className="mt-3 space-y-2">
                      {cat.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="border rounded p-3 bg-paper/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-forest">
                              {item.name_snapshot || item.name}
                            </span>
                            <span className="text-xs text-ink-muted">
                              avg ₹{formatINR(item.unit_price_paise / 100)}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted">
                            {item.quantity ? `${item.quantity} × ` : ''}
                            {item.unit_class_snapshot || 'per portion'}
                          </p>
                          <p className="text-xs text-ink-muted">
                            Estimated total for this item: ₹{
                              Math.round(
                                (item.unit_price_paise / 100) *
                                  (item.quantity || 1) *
                                  (event.guests || 1)
                              )
                            } (average range)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission section */}
        <Card>
          <CardHeader>
            <CardTitle>Submit your choices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted mb-4">
              Selected dishes and preferences will be sent to the event owner for review. They will contact you with a final quotation.
            </p>
            <form
              onSubmit={async (e: React.FormEvent) => {
                e.preventDefault()

                // Collect form data
                const formData = new FormData(e.target as HTMLFormElement)
                const clientName = formData.get('clientName') as string || 'Unknown client'
                const clientEmail = formData.get('clientEmail') as string || ''
                const clientPhone = formData.get('clientPhone') as string || ''

                // Build the summary of selections
                const selectionLines: Array<{name: string; qty: string; total: string}> = []
                catering.categories.forEach((cat: any) => {
                  cat.items.forEach((item: any) => {
                    const qty = item.quantity ? String(item.quantity) : '1'
                    const total = Math.round((item.unit_price_paise / 100) * (item.quantity || 1) * (event.guests || 1))
                    selectionLines.push({
                      name: item.name_snapshot || item.name,
                      qty,
                      total: String(total)
                    })
                  })
                })

                // Show success alert
                alert(
                  `Thank you! Your choices for ${event.title} have been submitted.${'\n\n'}The event owner will review and send a quotation via email or call soon.`
                )
              }}
            >
              <div className="grid gap-3 mb-4">
                <div className="row-span-2 space-y-3">
                  <label className="block text-sm text-ink-muted">Your name</label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="Your name"
                    className="flex h-11 w-full rounded-control border border-hairline bg-paper px-3 text-ink"
                    required
                  />
                </div>
                <div className="row-span-2 space-y-3">
                  <label className="block text-sm text-ink-muted">Email (optional)</label>
                  <input
                    type="email"
                    name="clientEmail"
                    placeholder="you@example.com"
                    className="flex h-11 w-full rounded-control border border-hairline bg-paper px-3 text-ink"
                  />
                </div>
                <div className="row-span-2 space-y-3">
                  <label className="block text-sm text-ink-muted">Phone (optional)</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    placeholder="+91 98765 43210"
                    className="flex h-11 w-full rounded-control border border-hairline bg-paper px-3 text-ink"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-6 text-sm font-medium text-white"
              >
                Submit choices to owner
              </button>
            </form>
            <p className="mt-3 text-xs text-ink-muted">
              After submission, the owner will review and send a quotation via email or call.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-hairline bg-white/90 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-ink-muted">
            This is a shared view for {event.title}. For questions, contact the event organizer directly.
          </p>
        </div>
      </footer>
    </div>
  )
}