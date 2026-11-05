import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { useState } from 'react'
import { ArrowLeft, Check, Layers, Mail, Phone, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/page-header'
import { formatINR } from '@/lib/domain/money'

interface ShareService {
  id: string
  key: string
  label: string
  status: string
  configSnapshot: Record<string, unknown>
}

interface ShareEvent {
  id: string
  title: string
  eventDate: string
  startTime: string | null
  endTime: string | null
  venueName: string | null
  venueAddress: string | null
  guests: number
  status: string
  eventType: string | null
  notes: string | null
}

interface ShareData {
  event: ShareEvent
  orgId: string
  services: ShareService[]
}

export const metadata = { title: 'Event Share View' }

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/share/${slug}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    notFound()
  }

  const data: ShareData = await res.json()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-hairline bg-white/90 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-forest"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to EventsMa
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-forest">{data.event.title}</h1>
            <Badge tone="outline">{data.event.eventType || 'Occasion'}</Badge>
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
                <p className="font-medium">{data.event.eventDate}</p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Guests</p>
                <p className="font-medium">{data.event.guests}</p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Venue</p>
                <p className="font-medium">{data.event.venueName || 'Not specified'}</p>
              </div>
            </div>
            {data.event.notes && (
              <div>
                <p className="text-sm text-ink-muted">Notes</p>
                <p className="font-medium">{data.event.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services available */}
        <Card>
          <CardHeader>
            <CardTitle>Services for this event</CardTitle>
            <p className="text-sm text-ink-muted">
              Select the services you need. Each service has its own options and pricing.
            </p>
          </CardHeader>
          <CardContent>
            {data.services.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-6 w-6" aria-hidden />}
                title="No services configured"
                description="The event owner hasn't added any services to this event yet."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.services.map((svc) => (
                  <ServiceCard key={svc.id} service={svc} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit your requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareSubmissionForm eventId={data.event.id} services={data.services} />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-hairline bg-white/90 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-ink-muted">
            This is a shared view for <b>{data.event.title}</b>. For questions, contact the event
            organizer directly.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:" className="text-sm text-ink-muted flex items-center gap-1.5 hover:text-forest">
              <Mail className="h-4 w-4" aria-hidden />
              Email
            </a>
            <a href="tel:" className="text-sm text-ink-muted flex items-center gap-1.5 hover:text-forest">
              <Phone className="h-4 w-4" aria-hidden />
              Call
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ service }: { service: ShareService }) {
  const serviceConfig: Record<string, string> = {}
  for (const [k, v] of Object.entries(service.configSnapshot)) {
    if (typeof v === 'string') serviceConfig[k] = v
  }

  return (
    <Card className="border border-hairline bg-paper/50 hover:border-mint/50 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{service.label}</CardTitle>
          <Badge tone="outline" className="text-[9px] px-2 py-1">
            {service.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Service key
            </span>
            <span className="text-[10px] text-ink-muted truncate">{service.key}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Status
            </span>
            <Badge tone={service.status === 'confirmed' ? 'success' : 'mint'} className="text-[9px]">
              {service.status}
            </Badge>
          </div>
        </div>
        <p className="text-[10px] text-ink-muted mt-3">
          Configure this service in the owner workspace to see available options.
        </p>
      </CardContent>
    </Card>
  )
}

function ShareSubmissionForm({
  eventId,
  services,
}: {
  eventId: string
  services: ShareService[]
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const clientName = formData.get('clientName') as string
    const clientEmail = formData.get('clientEmail') as string
    const clientPhone = formData.get('clientPhone') as string
    const message = formData.get('message') as string

    // Collect selections per service
    const selections: Record<string, any> = {}
    services.forEach((svc) => {
      const svcSelections: Record<string, any> = {}
      // Collect all form fields prefixed with the service key
      for (const [key, value] of formData.entries()) {
        if (key.startsWith(`${svc.key}:`)) {
          const fieldKey = key.slice(`${svc.key}:`.length)
          svcSelections[fieldKey] = value
        }
      }
      if (Object.keys(svcSelections).length > 0) {
        selections[svc.key] = svcSelections
      }
    })

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/share/${eventId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            clientName,
            clientEmail,
            clientPhone,
            selections,
            message,
          }),
        }
      )

      if (!res.ok) {
        throw new Error('Submission failed')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Try again.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-card border border-mint bg-mint-subtle px-6 py-8 text-center">
        <Check className="h-10 w-10 text-positive mx-auto mb-3" aria-hidden />
        <h2 className="text-lg font-medium text-ink">Submitted successfully</h2>
        <p className="text-sm text-ink-muted mt-2">
          Your selections have been sent to the event owner. They will review and contact you
          with a quotation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Your name</label>
          <input
            name="clientName"
            type="text"
            required
            className="h-10 w-full rounded-control border border-hairline bg-paper px-3 text-ink placeholder:text-ink-muted/70"
            placeholder="Your name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Email (optional)</label>
          <input
            name="clientEmail"
            type="email"
            className="h-10 w-full rounded-control border border-hairline bg-paper px-3 text-ink placeholder:text-ink-muted/70"
            placeholder="you@example.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Phone (optional)</label>
          <input
            name="clientPhone"
            type="tel"
            className="h-10 w-full rounded-control border border-hairline bg-paper px-3 text-ink placeholder:text-ink-muted/70"
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Message to the owner</label>
          <textarea
            name="message"
            rows={3}
            className="h-24 w-full rounded-control border border-hairline bg-paper px-3 text-ink placeholder:text-ink-muted/70"
            placeholder="Any special requirements or questions..."
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-hairline">
        <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted mb-3">
          Your service selections
        </h3>
        <div className="space-y-3">
          {services.map((svc) => (
            <div key={svc.id} className="p-3 rounded-control border border-hairline bg-paper/50">
              <p className="text-xs font-medium text-ink">{serviceLabel(svc.key)}</p>
              <p className="text-[10px] text-ink-muted">
                Select {serviceLabel(svc.key)} options above, then submit below.
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-control border border-terracotta/30 bg-terracotta-soft px-3 py-2 text-sm text-terracotta">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-forest text-white hover:bg-forest-hover"
      >
        {submitting ? (
          <>
            <Send className="h-4 w-4 mr-2" aria-hidden />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" aria-hidden />
            Submit requirements
          </>
        )}
      </Button>
    </form>
  )
}

function serviceLabel(key: string): string {
  const labels: Record<string, string> = {
    catering: 'Catering & food service',
    decor: 'Decoration & styling',
    makeup: 'Makeup & beauty',
    photography: 'Photography & video',
    specialist: 'Specialist service',
  }
  return labels[key] || key
}