import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  FileText,
  Layers3,
  Palette,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Users,
  X,
} from 'lucide-react'
import { SectionIntro, SectionShell } from './section'
import { DashboardPreview, MarginPreview } from './product-preview'

const CAPABILITIES = [
  {
    icon: Layers3,
    title: 'Configurable services',
    body: 'Catering, decor, photography and specialist services share one workspace.',
  },
  {
    icon: FileText,
    title: 'Structured catalogues',
    body: 'Each service keeps its own items, units, price, cost and tax treatment.',
  },
  {
    icon: ShieldCheck,
    title: 'Server-verified money',
    body: 'Integer paise, per-line tax, discount allocation and rupee round-off.',
  },
  {
    icon: BarChart3,
    title: 'Customer-ready quotes',
    body: 'A public token link, PDF and WhatsApp share, with acceptance recorded.',
  },
]

export function CapabilityStrip() {
  return (
    <section className="border-t border-white/10 bg-night-soft">
      <div className="mx-auto grid w-full max-w-7xl gap-px px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
        {CAPABILITIES.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="px-0 py-5 sm:px-6 sm:py-1 lg:px-7">
              <Icon className="h-5 w-5 text-mint-bright" aria-hidden />
              <h2 className="mt-3 text-sm font-semibold text-cream">{item.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{item.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const PROBLEMS = [
  'Three spreadsheets, two WhatsApp threads and one missed line.',
  'Per-guest dishes, flat decor and hourly crew priced in different places.',
  'Tax added by hand after the customer has already seen a number.',
  'The quote goes out before anyone checks what the event actually costs.',
]

const SOLUTIONS = [
  'One workspace for every service, event and quote.',
  'Catalogues with the unit and tax each service actually uses.',
  'Totals computed on the server and frozen into the sent version.',
  'Cost and margin visible before you press send.',
]

export function ProblemSolution() {
  return (
    <SectionShell id="features">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <SectionIntro
          eyebrow="The quotation problem"
          title={
            <>
              Event quoting breaks when every service lives{' '}
              <span className="text-mint-bright">in a different file.</span>
            </>
          }
          description="A wedding is not one price list. It is catering, decor, photography, crew, transport and tax â€” usually assembled by hand. EventsMa gives every service one structured home."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/[0.06] p-5 sm:p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-terracotta">
              Without a system
            </p>
            <ul className="mt-4 space-y-3">
              {PROBLEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-white/60">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-mint/20 bg-mint/[0.055] p-5 sm:p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mint-bright">
              With EventsMa
            </p>
            <ul className="mt-4 space-y-3">
              {SOLUTIONS.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-bright" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

export function ProductShowcase() {
  return (
    <SectionShell id="product" tone="soft">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionIntro
          eyebrow="The workspace"
          title={
            <>
              See the product before you{' '}
              <span className="text-mint-bright">sign in.</span>
            </>
          }
          description="These are the screens a business uses every day: the dashboard that shows what needs attention, and the margin view that answers whether the quote is worth sending."
        />
        <Link
          href="/signup"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control border border-white/15 px-4 text-sm text-cream transition-colors hover:bg-white/5"
        >
          Open a workspace
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <DashboardPreview />
          <h3 className="mt-6 font-display text-2xl text-cream">Know what needs attention</h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60">
            Stale quotes, events inside two weeks and invoices past due sit in one list. Every
            number links back to the record that produced it.
          </p>
          <ul className="mt-4 space-y-2 text-[13px] text-white/60">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-bright" aria-hidden />
              Server-rendered KPIs in integer paise
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-bright" aria-hidden />
              Enabled services and recent quotes in one view
            </li>
          </ul>
        </div>

        <div className="min-w-0">
          <MarginPreview />
          <h3 className="mt-6 font-display text-2xl text-cream">
            Quote value is not the same as profit
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60">
            The margin panel separates delivered cost from the customer total. It is internal by
            design and never appears on the public quotation.
          </p>
          <ul className="mt-4 space-y-2 text-[13px] text-white/60">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-bright" aria-hidden />
              Cost per line, not a guessed percentage
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-bright" aria-hidden />
              Margin shown after tax and order discount
            </li>
          </ul>
        </div>
      </div>
    </SectionShell>
  )
}

const SERVICES = [
  {
    icon: UtensilsCrossed,
    label: 'Catering & food service',
    body: 'Per-guest dishes, live counters and serving teams, with a guest-count basis.',
    tag: 'per guest / flat / per unit',
  },
  {
    icon: Palette,
    label: 'Decor & styling',
    body: 'Stage, floral and lighting elements priced flat, per unit or per day.',
    tag: 'flat / per unit / per day',
  },
  {
    icon: Camera,
    label: 'Photography & video',
    body: 'Coverage packages, crew kits and deliverables with their own tax rate.',
    tag: 'flat / per day / per hour',
  },
  {
    icon: Sparkles,
    label: 'Specialist services',
    body: 'A planner, makeup artist, rental or anything else you define as a service.',
    tag: 'configurable catalogue',
  },
]

const AUDIENCES = [
  ['Caterers', UtensilsCrossed],
  ['Event planners', Users],
  ['Decorators', Palette],
  ['Photographers', Camera],
  ['Multi-service companies', Layers3],
] as const

export function SolutionsSection() {
  return (
    <SectionShell id="solutions">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="min-w-0">
          <SectionIntro
            eyebrow="Built for multi-service businesses"
            title={
              <>
                Services are configuration,{' '}
                <span className="text-mint-bright">not code paths.</span>
              </>
            }
            description="Enable only what you provide. Each service gets its own catalogue, billing units and tax treatment; the event composes them into one quotation."
          />
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                Enabled services
              </p>
              <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] text-mint-bright">
                4 active
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {SERVICES.map((service) => {
                const Icon = service.icon
                return (
                  <div
                    key={service.label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-night/40 px-3 py-2.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mint/10 text-mint-bright">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-cream">{service.label}</p>
                      <p className="truncate text-[10px] text-white/55">{service.tag}</p>
                    </div>
                    <Check className="h-3.5 w-3.5 shrink-0 text-mint-bright" aria-hidden />
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-white/55">
              Only enabled services appear in the event composer and the customer document.
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-2">
            {SERVICES.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-mint/25 hover:bg-white/[0.055]"
                >
                  <Icon className="h-5 w-5 text-mint-bright" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-cream">{service.label}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{service.body}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-mint/20 bg-mint/[0.06] p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mint-bright">
              Who it is for
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AUDIENCES.map(([label, Icon]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/65"
                >
                  <Icon className="h-3.5 w-3.5 text-mint-bright" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
